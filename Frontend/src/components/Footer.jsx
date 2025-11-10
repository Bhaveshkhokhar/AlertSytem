import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-dark text-light mt-auto py-4">
      <div className="container">
        <div className="row">
          <div className="col-md-3 mb-3 mb-md-0">
            <h5 className="text-light mb-3">Alert System</h5>
            <p className="text-light mb-0">
              Intelligent alert management and escalation system for efficient
              incident response.
            </p>
          </div>
          <div className="col-md-3 mb-3 mb-md-0">
            <h5 className="text-light mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link
                  to="/dashboard"
                  className="text-light text-decoration-none"
                >
                  Dashboard
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/rules" className="text-light text-decoration-none">
                  Rules
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/auto-closed"
                  className="text-light text-decoration-none"
                >
                  Auto-Closed Alerts
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="text-light mb-3">Contact</h5>
            <ul className="list-unstyled text-light">
              <li className="mb-2">
                <i className="bi bi-envelope me-2"></i>
                support@alertsystem.com
              </li>
              <li className="mb-2">
                <i className="bi bi-telephone me-2"></i>
                (555) 123-4567
              </li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5 className="text-light mb-3">Test Links</h5>
            <ul className="list-unstyled text-light">
              <li className="mb-2">
                <Link
                  to="/create-alert"
                  className="text-light text-decoration-none"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Create New Alert
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/alerts" className="text-light text-decoration-none">
                  <i className="bi bi-list me-2"></i>
                  View All Alerts
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr className="my-4 bg-secondary" />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start text-light">
            <small>
              &copy; {currentYear} Alert System. All rights reserved.
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end mt-3 mt-md-0">
            <a href="#" className="text-light text-decoration-none me-3">
              Terms of Service
            </a>
            <a href="#" className="text-light text-decoration-none">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
