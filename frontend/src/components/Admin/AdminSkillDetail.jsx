import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminSkillDetail.css';

const AdminSkillDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSkillDetails();
    }
  }, [id, user]);

  const fetchSkillDetails = async () => {
    try {
      const res = await api.get(`/admin/skills/${id}`);
      if (res.data.success) {
        setSkill(res.data.skill);
      }
    } catch (err) {
      console.error('Error fetching admin skill detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/skills/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setSkill({ ...skill, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating skill status:', err);
      alert('Failed to update status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="skills" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/skills')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Skill Details</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button className="btn-warn">Warn Provider</button>
            <button 
              className="btn-mark btn-verify-mentor" 
              onClick={() => handleUpdateStatus('Active')}
              disabled={skill?.status === 'Active'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
              Verify Mentor
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading skill details...</div>
        ) : skill ? (
          <div className="admin-skill-grid">
            {/* Info Card */}
            <div className="skill-info-card">
              <div className="skill-info-header">
                <div>
                  <h2>{skill.title}</h2>
                  <div className="skill-price-text">
                    {skill.charge_type === 'Paid' ? `Paid (₹${skill.hourly_rate}/hr)` : 'Exchange'}
                  </div>
                </div>
                <span className={`status-badge-lg ${skill.status?.toLowerCase() || 'pending'}`}>
                  {skill.status || 'Pending'}
                </span>
              </div>
              
              <div className="skill-meta-grid">
                <div className="meta-item">
                  <label>CATEGORY</label>
                  <span>{skill.category}</span>
                </div>
                <div className="meta-item">
                  <label>SESSION</label>
                  <span>{skill.skill_type || 'Online'}</span>
                </div>
                <div className="meta-item">
                  <label>AVAILABILITY</label>
                  <span>{skill.available_time_slot || 'Weekends'}</span>
                </div>
              </div>

              <div className="skill-description-admin">
                <h3>Description</h3>
                <p>{skill.description}</p>
              </div>
            </div>

            {/* Provider Card */}
            <div className="provider-details-card">
              <h3>PROVIDER DETAILS</h3>
              <div className="provider-profile-sm">
                <div className="provider-avatar-sm" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                  {skill.provider_avatar ? (
                    <img src={`http://localhost:5000${skill.provider_avatar}`} alt="" />
                  ) : (
                    skill.first_name.charAt(0)
                  )}
                </div>
                <div className="provider-info-text">
                  <span className="provider-name-admin">{skill.first_name} {skill.last_name}</span>
                  <span className="provider-sub-text">Computer Science Dept</span>
                  <Link to={`/admin/students/${skill.user_id}`} className="view-profile-link">View Profile</Link>
                </div>
              </div>
            </div>

            {/* History Card */}
            <div className="history-card-admin">
              <h3>Reviews & History</h3>
              <div className="history-item-admin">
                <div className="history-item-content">
                  <strong>Completed Session with Jane Smith</strong>
                  <span className="history-date">2 days ago</span>
                  <p>"Very helpful and explained everything clearly!"</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Skill not found</div>
        )}
      </main>
    </div>
  );
};

export default AdminSkillDetail;
