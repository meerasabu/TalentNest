import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    campusEmail: '',
    department: '',
    graduationYear: '',
    password: ''
  });
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/signup', formData, {
        headers: { 'Content-Type': 'application/json' }
      });
      setMessage({ type: 'success', text: 'Account created successfully! Redirecting...' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error signing up. Please try again.';
      setMessage({ type: 'error', text: errMsg });
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '1rem' }}>
      <Link to="/" className="modern-back-btn" title="Go Back">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </Link>
      <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center', color: '#1f2937' }}>
          Create an Account
        </h2>
        {message && <div style={{ color: message.type === 'error' ? 'red' : 'green', marginBottom: '1rem', textAlign: 'center' }}>{message.text}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>First Name</label>
            <input type="text" id="firstName" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Last Name</label>
            <input type="text" id="lastName" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Campus Email</label>
            <input type="email" id="campusEmail" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Department</label>
            <select id="department" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}>
              <option value="" disabled>Select Department</option>
              <option value="Department of CS (PG)">Department of CS (PG)</option>
              <option value="Department of CS (UG)">Department of CS (UG)</option>
              <option value="Department of English">Department of English</option>
              <option value="Department of Social Science">Department of Social Science</option>
              <option value="Department of Life Science">Department of Life Science</option>
              <option value="Department of Management">Department of Management</option>
              <option value="Department of Psychology">Department of Psychology</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Graduation Year</label>
            <select id="graduationYear" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}>
              <option value="" disabled>Select Year</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
              <option value="2031">2031</option>
              <option value="2032">2032</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.25rem' }}>Password</label>
            <input type="password" id="password" onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', boxSizing: 'border-box' }}/>
          </div>

          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#4f46e5', color: 'white', fontWeight: '600', border: 'none', borderRadius: '0.375rem', marginTop: '1rem', cursor: 'pointer' }}>
            Register
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
