import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    campusEmail: '',
    password: ''
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/login', formData);
      if (response.data.success) {
        // Persist user session
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.user.role === 'admin') {
          navigate('/admin', { state: { user: response.data.user } });
        } else {
          navigate('/index', { state: { user: response.data.user } });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during sign in.');
    }
  };

  return (
    <div className="login-container">
      <Link to="/" className="modern-back-btn" title="Go Back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </Link>
      
      <div className="login-card">
        <div className="avatar">T</div>
        
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Enter your credentials to access the nest</p>

        {error && <div className="error-message" style={{color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.75rem', textAlign: 'center'}}>{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Campus Email</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/>
                </svg>
              </span>
              <input type="email" id="campusEmail" placeholder="name@university.edu" value={formData.campusEmail} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <div className="label-wrapper">
              <label htmlFor="password">Password</label>
              <Link to="/reset-password" className="primary-link">Forgot?</Link>
            </div>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
                </svg>
              </span>
              <input type="password" id="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
            </div>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Remember me</label>
          </div>

          <button type="submit" className="login-button">Sign In</button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/signup" className="primary-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
