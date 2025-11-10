import React, { useState, useEffect, useRef } from "react";
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const username = usernameRef.current?.value?.trim();
    const password = passwordRef.current?.value || "";

    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: username, password }),
      });

      if (!res.ok) {
        const err = await res.text();
        setError(err || "Login failed");
        return;
      }

      const data = await res.json();
      // Accept either authToken or token field
      const authToken =
        data.authToken || data.token || data.accessToken || null;
      if (!authToken) {
        setError("Invalid response from auth server");
        return;
      }

      localStorage.setItem("token", authToken);
      navigate("/dashboard");
    } catch (err) {
      setError("Unable to reach authentication server");
      console.error(err);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Alert System Login</h2>
                <p className="text-muted">Welcome back! Please log in.</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    ref={usernameRef}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    ref={passwordRef}
                    required
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Log In
                  </Button>
                </div>
              </Form>

              {/* Removed demo account listing - credentials come from backend */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
