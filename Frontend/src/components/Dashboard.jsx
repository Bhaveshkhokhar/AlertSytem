import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Table, Form, Badge } from "react-bootstrap";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import moment from "moment";
import AlertDrilldown from "./AlertDrilldown";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [severityCounts, setSeverityCounts] = useState({
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [trendDataWeekly, setTrendDataWeekly] = useState([]);

  // Build 4-week buckets (labels: "start - end") with current week as last point
  // The weekly API returns items like: [{"totalAlerts":9,"escalations":3,"week":"2025-45","autoClosed":1}]
  const weeklyChartData = React.useMemo(() => {
    const startOfCurrentWeek = moment().startOf("isoWeek");
    const buckets = [];
    for (let i = 3; i >= 0; i--) {
      const start = moment(startOfCurrentWeek).subtract(i, "weeks");
      const end = moment(start).endOf("isoWeek");

      let match = null;
      if (Array.isArray(trendDataWeekly) && trendDataWeekly.length) {
        match = trendDataWeekly.find((it) => {
          // Preferred: API returns 'week' as 'YYYY-WW' (ISO week). Match by isoWeek and isoWeekYear.
          if (it.week) {
            const parts = String(it.week).split("-");
            if (parts.length === 2) {
              const year = parseInt(parts[0], 10);
              // handle week like '45' or 'W45'
              const weekStr = parts[1].replace(/^W/i, "");
              const weekNum = parseInt(weekStr, 10);
              if (!Number.isNaN(year) && !Number.isNaN(weekNum)) {
                const itStart = moment()
                  .isoWeekYear(year)
                  .isoWeek(weekNum)
                  .startOf("isoWeek");
                if (itStart.isSame(start, "day")) return true;
              }
            }
          }

          // Backwards compatibility: check other possible fields
          if (it.weekStart && moment(it.weekStart).isSame(start, "day"))
            return true;
          if (it.startDate && moment(it.startDate).isSame(start, "day"))
            return true;
          if (it.from && moment(it.from).isSame(start, "day")) return true;
          if (it.date) {
            const d = moment(it.date);
            if (d.isBetween(start, end, "day", "[]")) return true;
          }
          if (it.label) {
            const label = String(it.label);
            if (
              label.includes(start.format("YYYY-MM-DD")) ||
              label.includes(start.format("MMM D"))
            )
              return true;
          }

          return false;
        });
      }

      buckets.push({
        date: `${start.format("MMM D")} - ${end.format("MMM D")}`,
        totalAlerts: match?.totalAlerts || 0,
        escalations: match?.escalations || match?.escalation || 0,
        autoClosed:
          match?.autoClosed || match?.auto_closed || match?.autoClosed || 0,
      });
    }

    return buckets;
  }, [trendDataWeekly]);
  useEffect(() => {
    // Fetch all dashboard data once on mount and then every 2 minutes
    const fetchTrendData = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/alerts/trends", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch trend data");
        const data = await res.json();
        setTrendData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching trend data:", err);
        setTrendData([]);
      }
    };

    const fetchRecentAlerts = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/alerts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch recent alerts");
        const data = await res.json();
        setRecentEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching recent alerts:", err);
        setRecentEvents([]);
      }
    };

    const fetchSeverityCounts = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/dashboard/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch severity counts");
        const data = await res.json();
        setSeverityCounts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching severity counts:", err);
        setLoading(false);
      }
    };

    const fetchTopOffenders = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/dashboard/top", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch top offenders");
        const data = await res.json();
        setTopOffenders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching top offenders:", err);
        setTopOffenders([]);
      }
    };

    const fetchWeeklyTrend = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch(
          "http://localhost:8080/api/alerts/trends/weekly",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch weekly trend data");
        const data = await res.json();
        setTrendDataWeekly(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching weekly trend data:", err);
        setTrendDataWeekly([]);
      }
    };

    // initial fetch
    fetchTrendData();
    fetchRecentAlerts();
    fetchSeverityCounts();
    fetchTopOffenders();
    fetchWeeklyTrend();

    const interval = setInterval(() => {
      fetchTrendData();
      fetchRecentAlerts();
      fetchSeverityCounts();
      fetchTopOffenders();
      fetchWeeklyTrend();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  const [topOffenders, setTopOffenders] = useState([]);

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: "primary",
      ESCALATED: "danger",
      "AUTO-CLOSED": "warning",
      RESOLVED: "success",
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  // Drilldown modal state
  const [selectedAlert, setSelectedAlert] = React.useState(null);
  const [showDrilldown, setShowDrilldown] = React.useState(false);
  const [topSort, setTopSort] = useState("total");

  useEffect(() => {
    const fetchRecentAlerts = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/alerts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch recent alerts");
        const data = await res.json();
        setRecentEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching recent alerts:", err);
        setRecentEvents([]);
      }
    };

    fetchRecentAlerts();
  }, []);

  useEffect(() => {
    const fetchSeverityCounts = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/dashboard/stats", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch severity counts");
        const data = await res.json();
        setSeverityCounts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching severity counts:", err);
        setLoading(false);
      }
    };

    fetchSeverityCounts();
  }, []);

  useEffect(() => {
    const fetchTopOffenders = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:8080/api/dashboard/top", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch top offenders");
        const data = await res.json();
        setTopOffenders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching top offenders:", err);
        setTopOffenders([]);
      }
    };
    fetchTopOffenders();
  }, []);

  // Fetch weekly trend data on mount
  useEffect(() => {
    const fetchWeeklyTrend = async () => {
      const authToken = localStorage.getItem("token");
      try {
        const res = await fetch(
          "http://localhost:8080/api/alerts/trends/weekly",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch weekly trend data");
        const data = await res.json();
        setTrendDataWeekly(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching weekly trend data:", err);
        setTrendDataWeekly([]);
      }
    };

    fetchWeeklyTrend();
  }, []);

  const sortedTopOffenders = useMemo(() => {
    const list = Array.isArray(topOffenders) ? [...topOffenders] : [];
    if (topSort === "total") {
      list.sort((a, b) => (b.totalOpenAlerts || 0) - (a.totalOpenAlerts || 0));
    } else if (topSort === "critical") {
      list.sort((a, b) => (b.criticalAlerts || 0) - (a.criticalAlerts || 0));
    } else if (topSort === "latest") {
      list.sort((a, b) => {
        const da = a.latestAlertTimestamp
          ? new Date(a.latestAlertTimestamp).getTime()
          : 0;
        const db = b.latestAlertTimestamp
          ? new Date(b.latestAlertTimestamp).getTime()
          : 0;
        return db - da;
      });
    }
    return list;
  }, [topOffenders, topSort]);

  const normalizeEventToAlert = (event) => {
    // Normalize several possible shapes to the alert object used by AlertDrilldown
    const alertId =
      event.alertId || (event.id ? `ALT-${event.id}` : `ALT-${Date.now()}`);
    const status = event.status || event.currentState || "OPEN";
    const severity =
      event.severity || (event.type === "Overspeeding" ? "Critical" : "Info");
    const driverId = event.driverId || event.metadata?.driverId || "N/A";
    const vehicleId =
      event.vehicleId || event.metadata?.vehicle || event.vehicle || "N/A";
    const metadata = {
      ...(event.metadata || {}),
      eventCount: event.eventCount || event.metadata?.eventCount || 1,
      escalateCount:
        event.escalateCount ||
        event.escalations ||
        event.metadata?.escalateCount ||
        0,
      ruleTriggered:
        event.ruleTriggered ||
        event.metadata?.ruleTriggered ||
        event.type ||
        "N/A",
      description: event.description || event.reason || "",
    };
    const history =
      event.history ||
      (() => {
        // Build a minimal history from timestamp/previousState
        const h = [];
        if (event.timestamp || event.createdAt) {
          h.push({
            state: "OPEN",
            timestamp: event.createdAt || event.timestamp,
            reason: "Created",
          });
        }
        if (event.previousState || event.status === "ESCALATED") {
          h.push({
            state: "ESCALATED",
            timestamp: event.updatedAt || event.timestamp,
            reason: event.previousState || "Auto escalation",
          });
        }
        h.push({
          state: status,
          timestamp: event.updatedAt || event.timestamp || event.createdAt,
          reason: event.description || event.reason || "",
        });
        return h;
      })();

    return {
      alertId,
      status,
      severity,
      driverId,
      vehicleId,
      metadata,
      history,
      createdAt: event.createdAt || event.timestamp,
      updatedAt: event.updatedAt || event.timestamp,
      description: metadata.description,
    };
  };

  const openAlert = (event) => {
    const alert = normalizeEventToAlert(event);
    setSelectedAlert(alert);
    setShowDrilldown(true);

    // Fetch history for this alert and merge into the selected alert when available
    (async () => {
      try {
        const authToken = localStorage.getItem("token");
        const idParam = encodeURIComponent(event.alertId || event.id);
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
          console.warn("Failed to fetch alert history", res.status);
          return;
        }
        const historyData = await res.json();
        setSelectedAlert((prev) => ({
          ...prev,
          history: Array.isArray(historyData) ? historyData : prev.history,
          metadata: {
            ...(prev && prev.metadata ? prev.metadata : {}),
            driverId: alert.driverId,
            vehicleId: alert.vehicleId,
          },
        }));
      } catch (err) {
        console.error("Error fetching alert history:", err);
      }
    })();
  };

  const handleResolve = (alert, comment) => {
    // Call backend to resolve the alert then update recentEvents locally
    (async () => {
      try {
        const id = alert.alertId || alert.id;
        const authToken = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:8080/api/alerts/${encodeURIComponent(id)}/resolve`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          console.error("Failed to resolve alert on server", res.status);
          // still update UI optimistically
          setRecentEvents((prev) =>
            prev.map((e) => {
              const idMatch = e.alertId || (e.id ? `ALT-${e.id}` : null);
              if (idMatch === alert.alertId) {
                return {
                  ...e,
                  status: "RESOLVED",
                  updatedAt: new Date().toISOString(),
                  resolutionComment: comment || "Manually resolved",
                };
              }
              return e;
            })
          );
          return;
        }

        const updated = await res.json().catch(() => null);

        setRecentEvents((prev) =>
          prev.map((e) => {
            const idMatch = e.alertId || (e.id ? `ALT-${e.id}` : null);
            if (idMatch === alert.alertId) {
              return {
                ...e,
                ...(updated && typeof updated === "object" ? updated : {}),
                status: "RESOLVED",
                updatedAt:
                  (updated && updated.updatedAt) || new Date().toISOString(),
                resolutionComment:
                  (updated &&
                    (updated.resolutionComment || updated.resolvedReason)) ||
                  comment ||
                  "Manually resolved",
              };
            }
            return e;
          })
        );
      } catch (err) {
        console.error("Error resolving alert:", err);
        setRecentEvents((prev) =>
          prev.map((e) => {
            const idMatch = e.alertId || (e.id ? `ALT-${e.id}` : null);
            if (idMatch === alert.alertId) {
              return {
                ...e,
                status: "RESOLVED",
                updatedAt: new Date().toISOString(),
                resolutionComment: comment || "Manually resolved",
              };
            }
            return e;
          })
        );
      }
    })();
  };

  return (
    <div className="dashboard p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2>Alert Management Dashboard</h2>
        </Col>
      </Row>

      {/* Severity Count Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card bg="danger" text="white" className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Critical Alerts</h6>
                  <h2 className="mb-0 mt-2">{severityCounts.critical}</h2>
                </div>
                <div className="display-4 opacity-50">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
              </div>
              <small className="mt-2 d-block">
                Requires immediate attention
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="warning" text="dark" className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Warning Alerts</h6>
                  <h2 className="mb-0 mt-2">{severityCounts.warning}</h2>
                </div>
                <div className="display-4 opacity-50">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
              </div>
              <small className="mt-2 d-block">Monitor closely</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="info" text="white" className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">Info Alerts</h6>
                  <h2 className="mb-0 mt-2">{severityCounts.info}</h2>
                </div>
                <div className="display-4 opacity-50">
                  <i className="fas fa-info-circle"></i>
                </div>
              </div>
              <small className="mt-2 d-block">For your information</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Offenders */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Top Offenders</Card.Title>
                <Form.Select
                  size="sm"
                  style={{ width: "150px" }}
                  value={topSort}
                  onChange={(e) => setTopSort(e.target.value)}
                >
                  <option value="total">Sort by Total Alerts</option>
                  <option value="critical">Sort by Critical Alerts</option>
                  <option value="latest">Sort by Latest Alert</option>
                </Form.Select>
              </div>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Driver ID</th>
                      <th>Driver Name</th>
                      <th className="text-center">Total Open</th>
                      <th className="text-center">Critical</th>
                      <th className="text-center">Warning</th>
                      <th className="text-center">Info</th>
                      <th>Latest Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopOffenders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          no driver with open alert
                        </td>
                      </tr>
                    ) : (
                      sortedTopOffenders.map((driver) => (
                        <tr key={driver.driverId}>
                          <td>
                            <code>{driver.driverId}</code>
                          </td>
                          <td>{driver.driverName}</td>
                          <td className="text-center">
                            <Badge bg="primary" pill>
                              {driver.totalOpen}
                            </Badge>
                          </td>
                          <td className="text-center">
                            {driver.criticalCount > 0 && (
                              <Badge bg="danger" pill>
                                {driver.criticalCount}
                              </Badge>
                            )}
                          </td>
                          <td className="text-center">
                            {driver.warningCount > 0 && (
                              <Badge bg="warning" pill>
                                {driver.warningCount}
                              </Badge>
                            )}
                          </td>
                          <td className="text-center">
                            {driver.infoCount > 0 && (
                              <Badge bg="info" pill>
                                {driver.infoCount}
                              </Badge>
                            )}
                          </td>
                          <td>
                            <div>
                              {moment(driver.latestAlert).format("MMM D, YYYY")}
                            </div>
                            <small className="text-muted">
                              {moment(driver.latestAlert).format("h:mm A")}
                            </small>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Events */}
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title>Recent Alert Events</Card.Title>
                <div className="d-flex gap-2">
                  <Badge bg="primary" className="d-flex align-items-center">
                    <span className="pulse-dot me-1"></span> Live Updates
                  </Badge>
                </div>
              </div>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Alert ID</th>
                      <th>Source Type</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map((event) => (
                      <tr
                        key={event.alertId || event.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => openAlert(event)}
                      >
                        <td>
                          <code>{event.alertId}</code>
                        </td>
                        <td>
                          <Badge
                            bg={
                              event.sourceType === "Overspeeding"
                                ? "danger"
                                : event.sourceType === "Compliance"
                                ? "warning"
                                : "info"
                            }
                          >
                            {event.sourceType}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={
                              event.severity === "Critical"
                                ? "danger"
                                : event.severity === "Warning"
                                ? "warning"
                                : "info"
                            }
                            className="opacity-75"
                          >
                            {event.severity}
                          </Badge>
                        </td>
                        <td>{getStatusBadge(event.status)}</td>
                        <td>
                          <div>
                            {moment(event.createdAt).format("MMM D, YYYY")}
                          </div>
                          <small className="text-muted">
                            {moment(event.createdAt).format("h:mm A")}
                          </small>
                        </td>
                        <td>
                          <div>{moment(event.updatedAt).fromNow()}</div>
                          <small className="text-muted">
                            {moment(event.updatedAt).format("h:mm A")}
                          </small>
                        </td>
                        <td>
                          <div className="text-nowrap">
                            ID: {event.driverId}
                          </div>
                        </td>
                        <td>
                          <div className="text-nowrap">{event.vehicleId}</div>
                        </td>
                        <td>
                          <small className="text-muted">{event.metadata}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Trend Graph */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Alert Trends (daily)</Card.Title>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalAlerts"
                      stroke="#8884d8"
                      name="Total Alerts"
                    />
                    <Line
                      type="monotone"
                      dataKey="escalations"
                      stroke="#ff0000"
                      name="Escalations"
                    />
                    <Line
                      type="monotone"
                      dataKey="autoClosed"
                      stroke="#82ca9d"
                      name="Auto-Closed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <AlertDrilldown
        show={showDrilldown}
        onHide={() => setShowDrilldown(false)}
        alert={selectedAlert}
        onResolve={handleResolve}
      />

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Alert Trends (weekly)</Card.Title>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalAlerts"
                      stroke="#8884d8"
                      name="Total Alerts"
                    />
                    <Line
                      type="monotone"
                      dataKey="escalations"
                      stroke="#ff0000"
                      name="Escalations"
                    />
                    <Line
                      type="monotone"
                      dataKey="autoClosed"
                      stroke="#82ca9d"
                      name="Auto-Closed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
