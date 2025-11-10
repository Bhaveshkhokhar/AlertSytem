import React from "react";
import { Modal, Table, Badge, Button, Form } from "react-bootstrap";
import moment from "moment";

const AlertDrilldown = ({ show, onHide, alert, onResolve }) => {
  const getStatusBadge = (status) => {
    const colors = {
      OPEN: "primary",
      ESCALATED: "danger",
      "AUTO-CLOSED": "warning",
      RESOLVED: "success",
    };
    return <Badge bg={colors[status]}>{status}</Badge>;
  };

  // Resolving happens immediately without prompting for a reason

  if (!alert) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Alert Details #{alert.alertId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Current Status */}
        <div className="mb-4">
          <h5>Current Status</h5>
          <div className="d-flex gap-2 align-items-center">
            {getStatusBadge(alert.status)}
            <Badge
              bg={
                alert.severity.toLowerCase() === "critical"
                  ? "danger"
                  : alert.severity.toLowerCase() === "warning"
                  ? "warning"
                  : "info"
              }
            >
              {alert.severity}
            </Badge>
          </div>
        </div>
        {/* Metadata */}{" "}
        <div className="mb-4">
          <h5>Metadata</h5>
          <Table bordered>
            <tbody>
              <tr>
                <td className="fw-bold">Driver ID</td>
                <td>{alert.driverId}</td>
              </tr>
              <tr>
                <td className="fw-bold">Vehicle ID</td>
                <td>{alert.vehicleId}</td>
              </tr>
              <tr>
                <td className="fw-bold">Escalation Count</td>
                <td>{alert.metadata.escalateCount || 0}</td>
              </tr>
            </tbody>
          </Table>
        </div>
        {/* State History */}
        <div className="mb-4">
          <h5>State History</h5>
          <Table bordered>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {alert.history.map((entry, index) => (
                <tr key={index}>
                  <td>
                    {moment(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}
                  </td>
                  <td>{getStatusBadge(entry.toStatus)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {!(
          alert.status === "RESOLVED" ||
          alert.status === "AUTO-CLOSED" ||
          alert.resolved
        ) && (
          <Button
            variant="success"
            onClick={() => {
              // Resolve immediately without asking for a reason
              if (typeof onResolve === "function") onResolve(alert, "");
              onHide();
            }}
          >
            Resolve Alert
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>

      {/* No prompt modal - resolving happens immediately when user clicks Resolve */}
    </Modal>
  );
};

export default AlertDrilldown;
