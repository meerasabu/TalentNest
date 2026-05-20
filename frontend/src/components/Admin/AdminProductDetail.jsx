import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminProductDetail.css';

const AdminProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchProductDetails();
    }
  }, [id, user]);

  const fetchProductDetails = async () => {
    try {
      const res = await api.get(`/admin/marketplace/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
      }
    } catch (err) {
      console.error('Error fetching admin product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/admin/marketplace/${id}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        setProduct({ ...product, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating product status:', err);
      alert('Failed to update status');
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="marketplace" />

      <main className="admin-main">
        <div className="admin-breadcrumb-flex">
          <div className="breadcrumb-nav" onClick={() => navigate('/admin/marketplace')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <h1>Product Listing</h1>
          </div>
          
          <div className="admin-profile-actions">
            <button className="btn-warn">Warn Seller</button>
            <button 
              className="btn-mark" 
              onClick={() => handleUpdateStatus('Inappropriate')}
              disabled={product?.status === 'Inappropriate'}
            >
              Mark Inappropriate
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{padding: '2rem', textAlign: 'center'}}>Loading product details...</div>
        ) : product ? (
          <div className="admin-product-grid">
            {/* Image Section */}
            <div className="product-image-card">
              <div className="main-product-img">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${product.image_urls[0]}`} alt={product.title} />
                ) : (
                  <div className="img-placeholder-lg">No Image Available</div>
                )}
              </div>
            </div>

            {/* Info Card */}
            <div className="product-info-card">
              <div className="product-info-header">
                <h2>{product.title}</h2>
                <span className={`status-badge-lg ${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
              </div>
              <div className="product-price-lg">₹{product.price}</div>
              
              <div className="product-meta-grid">
                <div className="meta-item">
                  <label>CATEGORY</label>
                  <span>{product.category}</span>
                </div>
                <div className="meta-item">
                  <label>LISTED ON</label>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="product-description-admin">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Seller Card */}
            <div className="seller-details-card">
              <h3>SELLER DETAILS</h3>
              <div className="seller-profile-sm">
                <div className="seller-avatar-sm" style={{backgroundColor: '#F5F3FF', color: '#7C3AED'}}>
                  {product.seller_avatar ? (
                    <img src={`http://localhost:5000${product.seller_avatar}`} alt="" />
                  ) : (
                    product.first_name.charAt(0)
                  )}
                </div>
                <div className="seller-info-text">
                  <span className="seller-name-admin">{product.first_name} {product.last_name}</span>
                  <Link to={`/admin/students/${product.user_id}`} className="view-profile-link">View Profile</Link>
                </div>
              </div>
            </div>

            {/* Reports Card */}
            <div className="reports-card-admin">
              <h3>Reports & Flags</h3>
              <div className="empty-reports-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <p>No reports against this listing.</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{padding: '2rem', textAlign: 'center'}}>Product not found</div>
        )}
      </main>
    </div>
  );
};

export default AdminProductDetail;
