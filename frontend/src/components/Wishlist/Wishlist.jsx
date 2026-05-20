import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css';
import './Wishlist.css';

const Wishlist = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await api.get(`/wishlist/users/${user.id}`);
        if (res.data.success) {
          setWishlistItems(res.data.items);
        }
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user.id]);

  const handleRemoveFromWishlist = async (itemType, itemId) => {
    try {
      const res = await api.delete(`/wishlist/${user.id}/${itemType}/${itemId}`);
      if (res.data.success) {
        setWishlistItems(prev => prev.filter(item => !(item.type === itemType && item.id === itemId)));
      }
    } catch (err) {
      console.error('Error removing wishlist item:', err);
      alert('Failed to remove item.');
    }
  };

  const filteredItems = activeTab === 'all' ? wishlistItems : wishlistItems.filter(item => item.type === activeTab);

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Content Area */}
      <main className="dashboard-main wishlist-main">
        {/* Header */}
        <header className="main-header">
          <div className="search-bar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
            </svg>
            <input type="text" placeholder="Search saved items..." />
          </div>
          <div className="header-actions">
            <div className="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div className="icon-wrapper" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <div className="icon-wrapper notification-icon" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span className="notif-badge">2</span>
            </div>
          </div>
        </header>

        <div className="content-scrollable wishlist-content">
          <div className="wishlist-header">
            <h1 className="wishlist-title">My Wishlist</h1>
            <div className="wishlist-tabs">
              <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Items</button>
              <button className={`tab-btn ${activeTab === 'product' ? 'active' : ''}`} onClick={() => setActiveTab('product')}>Products</button>
              <button className={`tab-btn ${activeTab === 'skill' ? 'active' : ''}`} onClick={() => setActiveTab('skill')}>Skills</button>
              <button className={`tab-btn ${activeTab === 'service' ? 'active' : ''}`} onClick={() => setActiveTab('service')}>Services</button>
            </div>
          </div>

          {loading ? (
            <div style={{textAlign: 'center', marginTop: '2rem'}}>Loading wishlist...</div>
          ) : (
            <div className="wishlist-grid">
              {filteredItems.map(item => (
                <div key={item.wishlist_id} className="wishlist-card">
                  <div className="card-image-wrap">
                    <img src={item.image_url ? `http://localhost:5000${item.image_url}` : "https://placehold.co/600x400?text=No+Image"} alt={item.title} className="card-image" />
                    <div className="card-badge" style={{textTransform: 'uppercase'}}>{item.category}</div>
                    <button className="remove-wishlist" onClick={() => handleRemoveFromWishlist(item.type, item.id)}>❤️</button>
                  </div>
                  <div className="card-details">
                    <h3 className="card-title">{item.title}</h3>
                    <div className="card-meta">
                      <span className="card-price">₹{item.price}</span>
                      <span className="card-status">{item.status?.toUpperCase() || 'AVAILABLE'}</span>
                    </div>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button 
                        className="view-btn" 
                        onClick={() => navigate(`/${item.type === 'product' ? 'product' : item.type === 'skill' ? 'skill' : 'service'}/${item.id}`, { state: { user } })}
                        style={{flex: 1}}
                      >
                        View Details
                      </button>
                      <button 
                        className="view-btn" 
                        onClick={() => handleRemoveFromWishlist(item.type, item.id)}
                        style={{flex: 1, backgroundColor: '#FEE2E2', color: '#DC2626'}}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="empty-wishlist">
              <div className="empty-icon">❤️</div>
              <h2>Your wishlist is empty</h2>
              <p>Items you save will appear here.</p>
              <button className="browse-btn" onClick={() => navigate('/marketplace', { state: { user } })}>Browse Marketplace</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wishlist;
