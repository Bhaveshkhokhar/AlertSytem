import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import AlertList from "./components/AlertList";
import RulesAdmin from "./components/RulesAdmin";
import AlertForm from "./components/AlertForm";
import ConfigurationOverview from "./components/ConfigurationOverview";
import AutoClosedAlerts from "./components/AutoClosedAlerts";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <div className="app d-flex flex-column min-vh-100">
        <Navbar />
        <div className="container-fluid flex-grow-1 pb-5">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rules"
              element={
                <ProtectedRoute>
                  <RulesAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-alert"
              element={
                <ProtectedRoute>
                  <AlertForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/config"
              element={
                <ProtectedRoute>
                  <ConfigurationOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auto-closed"
              element={
                <ProtectedRoute>
                  <AutoClosedAlerts />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
