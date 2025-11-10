import React, { useState } from 'react';
import API from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/auth/register', { username, password });
      toast.success('Registered. Login now.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data || 'Registration failed');
    }
  };

  return (
    <div className="col-md-4 offset-md-4">
      <h3 className="mb-3 text-center">Register</h3>
      <form onSubmit={submit}>
        <input className="form-control mb-2" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input type="password" className="form-control mb-2" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn btn-success w-100">Register</button>
      </form>
    </div>
  );
}
