import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminServiceDetail.css';

const AdminServiceDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchServiceDetails();
    }
  }, [id, user]);

  const fetchServiceDetails = async () => {
    try {
      const res = await api.get(`/admin/services/${id}`);
      if (res.data.success) {
        setService(res.data.service);
      }
    } catch (err) {
      console.error('Error fetching admin service detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/services/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setService({ ...service, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating service status:', err);
      alert('Failed to update status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="services" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/services')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Service Details</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button className="btn-warn">Warn Provider</button>
            <button 
              className="btn-mark btn-suspicious" 
              onClick={() => handleUpdateStatus('Suspended')}
              disabled={service?.status === 'Suspended'}
            >
              Mark Suspicious
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading service details...</div>
        ) : service ? (
          <div className="admin-service-grid">
            {/* Info Card */}
            <div className="service-info-card">
              <div className="service-info-header">
                <div>
                  <h2>{service.title}</h2>
                  <div className="service-price-text">
                    ₹{service.standard_plan || '0'} / {service.service_type === 'Online' ? 'hr' : 'event'}
                  </div>
                </div>
                <span className={`status-badge-lg ${service.status?.toLowerCase() || 'active'}`}>
                  {service.status || 'Active'}
                </span>
              </div>
              
              <div className="service-meta-grid">
                <div className="meta-item">
                  <label>CATEGORY</label>
                  <span>{service.category || 'General'}</span>
                </div>
                <div className="meta-item">
                  <label>AVAILABILITY</label>
                  <span>Flexible</span>
                </div>
              </div>

              <div className="service-description-admin">
                <h3>Description</h3>
                <p>{service.description || 'Professional and reliable service offered for campus students. Available upon request.'}</p>
              </div>
            </div>

            {/* Provider Card */}
            <div className="provider-details-card">
              <h3>PROVIDER DETAILS</h3>
              <div className="provider-profile-sm">
                <div className="provider-avatar-sm" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                  {service.provider_avatar ? (
                    <img src={`http://localhost:5000${service.provider_avatar}`} alt="" />
                  ) : (
                    service.first_name.charAt(0)
                  )}
                </div>
                <div className="provider-info-text">
                  <span className="provider-name-admin">{service.first_name} {service.last_name}</span>
                  <span className="provider-sub-text">Student Provider</span>
                  <Link to={`/admin/students/${service.user_id}`} className="view-profile-link">View Profile</Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Service not found</div>
        )}
      </main>
    </div>
  );
};

export default AdminServiceDetail;
