import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token || token === 'undefined' || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeListings: 0,
    ongoingRequests: 0,
    pendingReports: 0
  });

  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="dashboard" />

      {/* Admin Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <h1>Dashboard</h1>
          <p>Campus ecosystem moderation overview.</p>
        </header>

        {loading ? (
          <div style={{padding: '2rem'}}>Loading dashboard metrics...</div>
        ) : (
          <>
            <div className="admin-kpi-grid">
              <div className="admin-kpi-card">
                <span className="kpi-title">Total Students</span>
                <span className="kpi-value">{stats.totalStudents.toLocaleString()}</span>
              </div>
              <div className="admin-kpi-card">
                <span className="kpi-title">Active Listings</span>
                <span className="kpi-value">{stats.activeListings.toLocaleString()}</span>
              </div>
              <div className="admin-kpi-card">
                <span className="kpi-title">Ongoing Requests</span>
                <span className="kpi-value">{stats.ongoingRequests.toLocaleString()}</span>
              </div>
              <div className="admin-kpi-card">
                <span className="kpi-title">Pending Reports</span>
                <span className="kpi-value">{stats.pendingReports.toLocaleString()}</span>
              </div>
            </div>

            <div className="admin-content-grid">
              <div className="admin-recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-feed">
                  <div className="activity-item">
                    <div className="activity-icon purple-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </div>
                    <div className="activity-content">
                      <p>Meera added a marketplace item: Calculus Textbook</p>
                      <span className="activity-time">2 minutes ago</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon purple-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 17 22 12"></polyline></svg>
                    </div>
                    <div className="activity-content">
                      <p>Alex published a tutoring skill</p>
                      <span className="activity-time">15 minutes ago</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon green-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div className="activity-content">
                      <p>Photography service completed</p>
                      <span className="activity-time">1 hour ago</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon orange-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <div className="activity-content">
                      <p>Conversation reported by a student</p>
                      <span className="activity-time">2 hours ago</span>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon blue-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                    </div>
                    <div className="activity-content">
                      <p>New student verification request</p>
                      <span className="activity-time">3 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-actions">
                <div className="action-card">
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <div className="action-info">
                    <h4>Manage Students</h4>
                    <p>Review accounts and verification</p>
                  </div>
                </div>

                <div className="action-card">
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                  </div>
                  <div className="action-info">
                    <h4>Review Listings</h4>
                    <p>Moderate marketplace items</p>
                  </div>
                </div>

                <div className="action-card">
                  <div className="action-icon purple-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                  </div>
                  <div className="action-info">
                    <h4>Handle Reports</h4>
                    <p>Review flagged content and chats</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
