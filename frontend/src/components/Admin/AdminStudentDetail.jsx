import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminStudentDetail.css';

const AdminStudentDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({ marketplace: 0, skills: 0, services: 0, orders: 0 });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchStudentDetails();
    }
  }, [id, user]);

  const fetchStudentDetails = async () => {
    try {
      const res = await api.get(`/admin/students/${id}`);
      if (res.data.success) {
        setStudent(res.data.student);
        setStats(res.data.stats);
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error('Error fetching admin student detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/students/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setStudent({ ...student, account_status: newStatus });
      }
    } catch (err) {
      console.error('Error updating student status:', err);
      alert('Failed to update status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="students" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/students')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Student Profile</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button className="btn-warn" onClick={() => handleUpdateStatus('Warned')}>Warn Student</button>
            <button 
              className={student?.account_status === 'Suspended' ? 'btn-activate' : 'btn-suspend'} 
              onClick={() => handleUpdateStatus(student?.account_status === 'Suspended' ? 'Active' : 'Suspended')}
            >
              {student?.account_status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading student profile...</div>
        ) : student ? (
          <div className="admin-profile-grid">
            {/* Left Column: Basic Info */}
            <div className="profile-left-card">
              <div className="profile-main-info">
                <div className="profile-avatar-large" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                  {student.profile_image ? (
                    <img src={`http://localhost:5000${student.profile_image}`} alt="" />
                  ) : (
                    student.first_name.charAt(0)
                  )}
                </div>
                <h2>{student.first_name} {student.last_name}</h2>
                <p className="profile-email">{student.email}</p>
                <span className={`status-badge-lg ${student.account_status === 'Suspended' ? 'suspended' : 'active'}`}>
                  {student.account_status}
                </span>
              </div>

              <div className="profile-detail-list">
                <div className="detail-item">
                  <label>DEPARTMENT</label>
                  <span>{student.department || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>GRADUATION YEAR</label>
                  <span>{student.graduation_year || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Activity & Reports */}
            <div className="profile-right-content">
              <div className="activity-overview-card">
                <h3>Activity Overview</h3>
                <div className="activity-stats-grid">
                  <div className="stat-box">
                    <span className="stat-num">{stats.marketplace}</span>
                    <span className="stat-label">Marketplace</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.skills}</span>
                    <span className="stat-label">Skills</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.services}</span>
                    <span className="stat-label">Services</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{stats.orders}</span>
                    <span className="stat-label">Orders</span>
                  </div>
                </div>
              </div>

              <div className="reports-history-card">
                <h3>Recent Reports Against User</h3>
                <div className="reports-list">
                  {reports.length > 0 ? reports.map((report) => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <span className="reporter">Flagged by: <strong>{report.reporter_name}</strong></span>
                        <span className="report-date">{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="report-reason">{report.reason}</p>
                      <span className={`report-status ${report.status.toLowerCase()}`}>{report.status}</span>
                    </div>
                  )) : (
                    <div className="empty-reports">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                      <p>No reports against this user.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Student not found</div>
        )}
      </main>
    </div>
  );
};

export default AdminStudentDetail;
