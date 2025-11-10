import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Badge,
  Form,
  Row,
  Col,
  ButtonGroup,
  Button,
  Modal,
} from "react-bootstrap";
import moment from "moment";
import AlertDrilldown from "./AlertDrilldown";

const AutoClosedAlerts = () => {
  const timelineStyles = `
    .timeline {
      position: relative;
      padding: 1rem 0;
    }
    .timeline-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 5px;
    }
    .timeline-item {
      position: relative;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 15px;
      bottom: -15px;
      width: 2px;
      background: #dee2e6;
    }
    .timeline-item:last-child::before {
      display: none;
    }
  `;
  const [timeFilter, setTimeFilter] = useState("24h");

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // State: current list and original fetched list
  const [initialAutoClosedAlerts, setInitialAutoClosedAlerts] = useState([]);
  const [autoClosedAlerts, setAutoClosedAlerts] = useState([]);

  // Fetch auto-closed alerts when the page/component opens (mount)
  useEffect(() => {
    const fetchAutoClosedAlerts = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/alerts/auto-close", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error(
            "Failed to fetch auto-closed alerts, status:",
            res.status
          );
          setInitialAutoClosedAlerts([]);
          setAutoClosedAlerts([]);
          return;
        }

        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setInitialAutoClosedAlerts(list);
        setAutoClosedAlerts(list);
      } catch (err) {
        console.error("Error fetching auto-closed alerts:", err);
        setInitialAutoClosedAlerts([]);
        setAutoClosedAlerts([]);
      }
    };

    fetchAutoClosedAlerts();
  }, []);

  // Apply client-side filters (time window and reason)
  const filteredAlerts = useMemo(() => {
    const now = moment();
    let list = Array.isArray(autoClosedAlerts) ? [...autoClosedAlerts] : [];

    // Time filter
    if (timeFilter) {
      let cutoff = null;
      if (timeFilter === "24h") cutoff = now.clone().subtract(24, "hours");
      else if (timeFilter === "7d") cutoff = now.clone().subtract(7, "days");

      if (cutoff) {
        list = list.filter((a) => {
          // API returns createdAt/updatedAt timestamps
          const ts = a.createdAt || a.updatedAt || a.timestamp;
          return ts ? moment(ts).isSameOrAfter(cutoff) : false;
        });
      }
    }

    return list;
  }, [autoClosedAlerts, timeFilter]);

  const normalizeToAlert = (a) => {
    // Normalize API alert shape to what drilldown expects
    const alertId = a.alertId || (a.id ? `ALT-${a.id}` : `ALT-${Date.now()}`);
    const metadata = {
      ...(a.metadata || {}),
      driverId: a.driverId || a.driver || null,
      vehicle: a.vehicleId || a.vehicle || "N/A",
      sourceType: a.sourceType || null,
      severity: a.severity || null,
      escalateCount:
        a.escalateCount || (a.metadata && a.metadata.escalateCount) || 0,
    };
    const history = a.history || [
      {
        state: a.status || "OPEN",
        timestamp: a.createdAt || a.updatedAt || a.timestamp,
        reason: a.description || "Created",
      },
      {
        state: "AUTO-CLOSED",
        timestamp: a.updatedAt || a.createdAt || a.timestamp,
        reason: a.description || "Auto-closed",
      },
    ];
    return {
      alertId,
      status: a.status || "AUTO-CLOSED",
      severity: a.severity || "Info",
      metadata,
      driverId: a.driverId || a.driver || metadata.driverId || null,
      vehicleId: a.vehicleId || a.vehicle || metadata.vehicle || "N/A",
      history,
      createdAt: a.createdAt || a.timestamp,
      updatedAt: a.updatedAt || a.timestamp,
      description: a.description || a.reason || "",
      id: a.id,
      raw: a,
    };
  };

  const handleRowClick = (alert) => {
    // Show drilldown immediately with normalized data
    const norm = normalizeToAlert(alert);
    setSelectedAlert(norm);
    setShowDetailModal(true);

    // Fetch detailed history from backend and merge when available
    (async () => {
      try {
        const authToken = localStorage.getItem("token");
        const idParam = encodeURIComponent(alert.alertId || alert.id);
        const res = await fetch(
          `http://localhost:8080/api/alerts/${idParam}/history`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) {
          console.warn(
            "No history available or failed to fetch history",
            res.status
          );
          return;
        }
        const historyData = await res.json();
        // merge history into the selected alert (preserve other fields)
        setSelectedAlert((prev) => ({
          ...prev,
          history: Array.isArray(historyData) ? historyData : prev.history,
        }));
      } catch (err) {
        console.error("Error fetching alert history:", err);
      }
    })();
  };

  const handleResolve = (alert, comment) => {
    // Call backend to resolve the alert, then update local state
    (async () => {
      try {
        const id = alert.alertId || alert.id;
        const authToken = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:8080/api/alerts/${encodeURIComponent(id)}/resolve`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ resolutionComment: comment || null }),
          }
        );

        if (!res.ok) {
          console.error("Failed to resolve alert on server", res.status);
          // still mark locally to keep UI responsive
          setAutoClosedAlerts((prev) =>
            prev.map((a) => {
              const aid = a.alertId || `ALT-${a.id}`;
              if (aid === alert.alertId) {
                return {
                  ...a,
                  resolved: true,
                  resolvedAt: new Date().toISOString(),
                  resolvedReason: comment || "Manually resolved",
                };
              }
              return a;
            })
          );
          return;
        }

        // Prefer updated object from server if returned
        const updated = await res.json().catch(() => null);

        setAutoClosedAlerts((prev) =>
          prev.map((a) => {
            const aid = a.alertId || `ALT-${a.id}`;
            if (aid === alert.alertId) {
              return {
                ...a,
                ...(updated && typeof updated === "object" ? updated : {}),
                resolved: true,
                resolvedAt:
                  (updated && updated.resolvedAt) || new Date().toISOString(),
                resolvedReason:
                  (updated &&
                    (updated.resolutionComment || updated.resolvedReason)) ||
                  comment ||
                  "Manually resolved",
              };
            }
            return a;
          })
        );
      } catch (err) {
        console.error("Error resolving alert:", err);
        // fallback: mark locally
        setAutoClosedAlerts((prev) =>
          prev.map((a) => {
            const aid = a.alertId || `ALT-${a.id}`;
            if (aid === alert.alertId) {
              return {
                ...a,
                resolved: true,
                resolvedAt: new Date().toISOString(),
                resolvedReason: comment || "Manually resolved",
              };
            }
            return a;
          })
        );
      }
    })();
  };

  const filterOptions = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
  ];

  return (
    <div className="auto-closed-alerts p-4">
      <style>{timelineStyles}</style>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Auto-Closed Alerts</h2>

            <div className="d-flex gap-3">
              <Form.Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {/* Stats Summary */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="bg-light">
                <Card.Body className="text-center">
                  <h6>Total Auto-Closed</h6>
                  <h3>{filteredAlerts.length}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Alerts Table */}
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Time</th>
                <th>Type</th>
                <th>Driver</th>

                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr
                  key={alert.id || alert.alertId}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(alert)}
                >
                  <td>
                    <div>{alert.alertId || `ALT-${alert.id}`}</div>
                  </td>
                  <td>
                    <div className="text-muted">
                      {moment(
                        alert.createdAt || alert.updatedAt || alert.timestamp
                      ).format("MMM D, YYYY h:mm A")}
                    </div>
                  </td>
                  <td>
                    <div>{alert.type}</div>
                    <small>
                      <Badge
                        bg={
                          (alert.severity || "").toLowerCase() === "warning"
                            ? "warning"
                            : (alert.severity || "").toLowerCase() === "info"
                            ? "info"
                            : "danger"
                        }
                      >
                        {alert.severity || ""}
                      </Badge>
                    </small>
                  </td>
                  <td>
                    {alert.driverId ||
                      (alert.metadata && alert.metadata.driverId)}
                  </td>
                  <td>
                    <small>
                      <div>
                        <strong>Vehicle:</strong>{" "}
                        {alert.vehicleId ||
                          (alert.metadata && alert.metadata.vehicle)}
                      </div>
                      <div>
                        <strong>Source:</strong>{" "}
                        {alert.sourceType ||
                          (alert.metadata && alert.metadata.sourceType) ||
                          "-"}
                      </div>
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <AlertDrilldown
            show={showDetailModal}
            onHide={() => setShowDetailModal(false)}
            alert={selectedAlert}
            onResolve={handleResolve}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default AutoClosedAlerts;
