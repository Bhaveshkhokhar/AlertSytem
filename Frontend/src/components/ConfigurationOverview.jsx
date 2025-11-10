import React from "react";
import { Card, Table, Badge, Row, Col } from "react-bootstrap";

const ConfigurationOverview = () => {
  // Sample rules data
  const rules = [
    {
      type: "overspeed",
      config: {
        escalate_if_count: 3,
        window_mins: 60,
      },
      escalationCount: 25,
      activeAlerts: 8,
    },
    {
      type: "feedback_negative",
      config: {
        escalate_if_count: 2,
        window_mins: 1440,
      },
      escalationCount: 15,
      activeAlerts: 5,
    },
    {
      type: "compliance",
      config: {
        auto_close_if: "document_valid",
      },
      escalationCount: 10,
      activeAlerts: 12,
    },
  ];

  const formatRuleConfig = (config) => {
    if (config.escalate_if_count) {
      return `Escalate after ${config.escalate_if_count} occurrences in ${config.window_mins} minutes`;
    }
    if (config.auto_close_if) {
      return `Auto-close when: ${config.auto_close_if}`;
    }
    return JSON.stringify(config);
  };

  return (
    <div className="configuration-overview p-4">
      <h2 className="mb-4">Configuration Overview</h2>

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Active Rules Configuration</Card.Title>
              <Table responsive striped>
                <thead>
                  <tr>
                    <th>Rule Type</th>
                    <th>Configuration</th>
                    <th>Active Alerts</th>
                    <th>Total Escalations</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, index) => (
                    <tr key={index}>
                      <td className="text-capitalize">
                        {rule.type.replace("_", " ")}
                        {rule.activeAlerts > 10 && (
                          <Badge bg="warning" className="ms-2">
                            High Activity
                          </Badge>
                        )}
                      </td>
                      <td>{formatRuleConfig(rule.config)}</td>
                      <td>
                        <Badge
                          bg={rule.activeAlerts > 10 ? "danger" : "primary"}
                        >
                          {rule.activeAlerts}
                        </Badge>
                      </td>
                      <td>{rule.escalationCount}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Alert Type Distribution</Card.Title>
              <Table>
                <tbody>
                  <tr>
                    <td>Overspeeding Alerts</td>
                    <td>
                      <div className="progress">
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: "45%" }}
                        >
                          45%
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Compliance Alerts</td>
                    <td>
                      <div className="progress">
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: "30%" }}
                        >
                          30%
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Negative Feedback</td>
                    <td>
                      <div className="progress">
                        <div
                          className="progress-bar bg-danger"
                          style={{ width: "25%" }}
                        >
                          25%
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>System Health</Card.Title>
              <Table>
                <tbody>
                  <tr>
                    <td>Rule Processing Time</td>
                    <td>
                      <Badge bg="success">Normal</Badge>
                      <small className="text-muted ms-2">Avg: 0.5s</small>
                    </td>
                  </tr>
                  <tr>
                    <td>Auto-close Job Status</td>
                    <td>
                      <Badge bg="success">Running</Badge>
                      <small className="text-muted ms-2">
                        Last run: 2 mins ago
                      </small>
                    </td>
                  </tr>
                  <tr>
                    <td>Alert Processing Queue</td>
                    <td>
                      <Badge bg="primary">5 pending</Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ConfigurationOverview;
