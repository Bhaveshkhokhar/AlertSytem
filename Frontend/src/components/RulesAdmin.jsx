import React, { useEffect, useState } from 'react';
import API from '../api';
import Loader from './Loader';
import { toast } from 'react-toastify';

export default function RulesAdmin(){
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get('http://localhost:8080/api/rules');
      setRules(JSON.stringify(res.data, null, 2));
    } catch (err) {
      toast.error('Failed to load rules');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const save = async () => {
    try {
      // we do a reload (server reads file) — for file-based rules, call POST /api/rules/reload after editing on server.
      await API.post('http://localhost:8080/api/rules/reload'); // backend will reload rules.json
      toast.success('Rules reloaded on server (make edits on server rules.json if file-based)');
      load();
    } catch (err) {
      toast.error('Reload failed');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="col-md-8 offset-md-2">
      <h4 className="mb-3">Rules Admin</h4>
      <div className="card p-3">
        <textarea className="form-control mb-3" rows="15" value={rules} onChange={e=>setRules(e.target.value)} readOnly />
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={save}>Reload Rules (server)</button>
          <small className="text-muted align-self-center">Note: Edit server rules.json directly for permanent changes.</small>
        </div>
      </div>
    </div>
  );
}
