import React, { useState } from "react";
import API from "../api";
import { toast } from "react-toastify";

export default function AlertForm({ reload }) {
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [sourceType, setSourceType] = useState("overspeed");
  const [metadata, setMetadata] = useState("");
  const [type, setType] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        vehicleId,
        sourceType,
        driverId,
        metadata,
        type
      };
      await API.post("/alerts", payload);
      toast.success("Alert created");
      setVehicleId("");
      setDriverId("");
      setMetadata("");
      setType("");
      if (reload) reload();
    } catch (err) {
      toast.error("Failed to create alert");
    }
  };

  return (
    <div className="card p-3 mb-3">
      <h6>Create Alert</h6>
      <form onSubmit={submit}>
        <input
          className="form-control mb-2"
          placeholder="Vehicle ID"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          required
        />
         <input
          className="form-control mb-2"
          placeholder="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />
        <input
          className="form-control mb-2"
          placeholder="Driver ID"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
        />
        <select
          className="form-select mb-2"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
        >
          <option value="overspeed">Safety</option>
          <option value="feedback_negative">Negative Feedback</option>
          <option value="compliance">Compliance</option>
        </select>
        {/* severity removed -- controlled server-side or determined by rule engine */}
        <textarea
          className="form-control mb-2"
          rows="2"
          placeholder="Metadata (JSON or text)"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
        ></textarea>
        <button className="btn btn-primary w-100">Create</button>
      </form>
    </div>
  );
}
