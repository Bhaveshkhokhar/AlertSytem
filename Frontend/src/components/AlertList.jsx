import React from 'react';
import API from '../api';
import { toast } from 'react-toastify';

export default function AlertList({ alerts, reload }){
  const resolve = async (id) => {
    try {
      await API.put(`/alerts/${id}/resolve`);
      toast.success('Alert resolved');
      if (reload) reload();
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  return (
    <div className="card p-3">
      <h6>All Alerts</h6>
      <div className="table-responsive">
        <table className="table table-sm table-hover">
          <thead>
            <tr>
              <th>ID</th><th>Driver</th><th>Type</th><th>Severity</th><th>Status</th><th>Time</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length===0 && <tr><td colSpan="7" className="text-center text-muted">No alerts</td></tr>}
            {alerts.map(a=>(
              <tr key={a.alertId}>
                <td>{a.alertId}</td>
                <td>{a.driverId}</td>
                <td>{a.sourceType}</td>
                <td>{a.severity}</td>
                <td>{a.status}</td>
                <td>{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</td>
                <td>
                  {a.status !== 'RESOLVED' ?
                    <button className="btn btn-sm btn-success" onClick={()=>resolve(a.alertId)}>Resolve</button>
                    : <span className="text-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
