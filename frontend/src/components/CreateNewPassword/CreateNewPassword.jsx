import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './CreateNewPassword.css';

const CreateNewPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const campusEmail = location.state?.campusEmail || '';
  const resetToken = location.state?.resetToken || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Redirect to forgot password if no reset session parameters exist
    if (!campusEmail || !resetToken) {
      navigate('/reset-password');
    }
  }, [campusEmail, resetToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await api.post('/reset-password', {
        campusEmail,
        resetToken,
        newPassword
      });
      setLoading(false);

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset password. Please try again.'
      });
    }
  };

  return (
    <div className="new-pass-container">
      <div className="new-pass-card">
        {/* Back Arrow inside the card */}
        <button className="new-pass-card-back" onClick={() => navigate('/verify-otp', { state: { campusEmail } })} title="Back">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <h1 className="new-pass-title">Create New Password</h1>
        <p className="new-pass-subtitle">Please enter your new password below</p>

        {message && (
          <div className={`new-pass-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="new-pass-form" onSubmit={handleSubmit}>
          <div className="new-pass-form-group">
            <label htmlFor="newPassword">NEW PASSWORD</label>
            <input
              type="password"
              id="newPassword"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="new-pass-form-group">
            <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="new-pass-button" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateNewPassword;
