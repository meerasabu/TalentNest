import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css';
import './Orders.css';
import Header from '../Common/Header';

const Orders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [activeTab, setActiveTab] = useState('buyer');

  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [rating, setRating] = useState(0);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [buyerRes, sellerRes] = await Promise.all([
        api.get(`/orders/buyer/${user.id}`),
        api.get(`/orders/seller/${user.id}`)
      ]);

      if (buyerRes.data.success) {
        setBuyerOrders(buyerRes.data.orders);
      }
      if (sellerRes.data.success) {
        setSellerOrders(sellerRes.data.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user.id]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this request? This will restore inventory and disable the chat.")) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        alert("Order cancelled successfully.");
        // Refresh orders
        const bRes = await api.get(`/orders/buyer/${user.id}`);
        if (bRes.data.success) setBuyerOrders(bRes.data.orders);
        const sRes = await api.get(`/orders/seller/${user.id}`);
        if (sRes.data.success) setSellerOrders(sRes.data.orders);
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const openReviewModal = () => {
    setRating(0);
    setRatingHover(0);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = () => {
    alert("Review submitted successfully!");
    setReviewModalOpen(false);
  };

  const getStatusLayer = (status) => {
    // We treat 'Pending' or 'PENDING' identically visually
    const s = status.toUpperCase();
    switch (s) {
      case 'PENDING':
        return <span className="ord-badge ord-pen"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> PENDING</span>;
      case 'ACCEPTED':
        return <span className="ord-badge ord-acc"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ACCEPTED</span>;
      case 'REJECTED':
        return <span className="ord-badge ord-rej"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> REJECTED</span>;
      case 'COMPLETED':
        return <span className="ord-badge ord-com"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> COMPLETED</span>;
      case 'CANCELLED':
        return <span className="ord-badge ord-rej" style={{ background: '#FEE2E2', color: '#EF4444' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> CANCELLED</span>;
      default:
        return null;
    }
  };

  const getActionLayer = (order, isBuyer) => {
    const s = order.status.toUpperCase();
    if (isBuyer) {
      if (s === 'PENDING') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out-warn" style={{ cursor: 'default' }}>Waiting for seller confirmation</button>
            <button className="ord-btn ord-btn-out" onClick={() => handleDeleteOrder(order.id)} style={{ color: '#DC2626', borderColor: '#FCA5A5' }}>Cancel Request</button>
          </div>
        );
      }
      if (s === 'ACCEPTED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-green" onClick={() => handleUpdateStatus(order.id, 'Completed')}>Mark as Completed</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'COMPLETED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-purp" onClick={openReviewModal}>Write Review</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'REJECTED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>Chat Disabled</button>
          </div>
        );
      }
    } else {
      // Seller view
      if (s === 'PENDING') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-purp" onClick={() => handleUpdateStatus(order.id, 'Accepted')}>Accept</button>
            <button className="ord-btn ord-btn-out" onClick={() => handleUpdateStatus(order.id, 'Rejected')}>Reject</button>
          </div>
        );
      }
      if (s === 'ACCEPTED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out-warn">Waiting for completion</button>
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'COMPLETED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" onClick={() => navigate('/messages', { state: { user, orderId: order.id } })}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> Open Chat</button>
          </div>
        );
      }
      if (s === 'REJECTED' || s === 'CANCELLED') {
        return (
          <div className="ord-act-grp">
            <button className="ord-btn ord-btn-out" style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>Chat Disabled</button>
          </div>
        );
      }
    }
  };

  const filteredList = (activeTab === 'buyer' ? buyerOrders : sellerOrders).filter(order => {
    // 1. Category Filter
    if (filterCategory !== 'All' && order.item_type !== filterCategory.toLowerCase()) return false;

    // 2. Search Term (Title or Person)
    const personName = activeTab === 'buyer' ? `${order.seller_first_name} ${order.seller_last_name}` : `${order.buyer_first_name} ${order.buyer_last_name}`;
    const searchMatch = order.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) || personName.toLowerCase().includes(searchTerm.toLowerCase());
    if (!searchMatch) return false;

    // 3. Date Filter
    if (filterDate !== 'All') {
      const orderDate = new Date(order.created_at);
      const today = new Date();
      if (filterDate === 'Today') {
        if (orderDate.toDateString() !== today.toDateString()) return false;
      } else if (filterDate === 'This Week') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        if (orderDate < weekAgo) return false;
      } else if (filterDate === 'This Month') {
        if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
      }
    }

    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedList = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const listElement = document.querySelector('.ord-scrollable');
    if (listElement) listElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterCategory, filterDate, searchTerm]);

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Primary Window Scope */}
      <main className="dashboard-main ord-main">
        {/* Main Interface Header */}
        <Header user={user} showSearch={false} />

        <div className="content-scrollable ord-scrollable">

          {/* Header Action Layers */}
          <div className="ord-header-row">
            <div className="ord-title-block">
              <h1 className="ord-title">Orders & Requests</h1>
              <p className="ord-subtitle">Manage your purchases and incoming requests.</p>
            </div>

            <div className="ord-tab-grp">
              <button
                className={`ord-tab-toggle ${activeTab === 'buyer' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('buyer')}
              >
                My Requests (Buyer)
              </button>
              <button
                className={`ord-tab-toggle ${activeTab === 'seller' ? 'active-tab' : ''}`}
                onClick={() => setActiveTab('seller')}
              >
                Received Requests (Seller)
              </button>
            </div>
          </div>

          <div className="ord-box-container">

            <div className="ord-box-hdr">
              <div className="ord-box-lft">
                <h3 className="ord-box-tl">{activeTab === 'buyer' ? "Orders you've requested" : "Requests for your items"}</h3>
                <span className="ord-box-lbl">{activeTab === 'buyer' ? "YOU ARE ACTING AS BUYER" : "YOU ARE ACTING AS SELLER"}</span>
              </div>

              <div className="ord-filters-row">
                <div className="ord-filter-group">
                  <label>Type:</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="All">All Types</option>
                    <option value="product">Products</option>
                    <option value="skill">Skills</option>
                    <option value="service">Services</option>
                  </select>
                </div>

                <div className="ord-filter-group">
                  <label>Time:</label>
                  <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                    <option value="All">All Time</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                </div>

                <div className="ord-search-box">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" /></svg>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ord-list">
              {paginatedList.map((order, idx) => (
                <div key={order.id} className={`ord-itm ${idx !== paginatedList.length - 1 ? 'ord-border-btm' : ''}`}>
                  <div className="ord-itm-body">
                    <img src={order.itemImage ? `http://localhost:5000${order.itemImage}` : `https://placehold.co/80x80/e2e8f0/cbd5e1?text=${order.category}`} alt={order.itemTitle} className="ord-itm-ava" />
                    <div className="ord-itm-core">
                      <div className="ord-itm-titlerow">
                        <h4 className="ord-itm-name">{order.itemTitle}</h4>
                        {getStatusLayer(order.status)}
                      </div>
                      <div className="ord-itm-sub">
                        <span className="ord-sub-p">₹{order.itemPrice}</span>
                        <span className="ord-sub-dot">•</span>
                        <span className="ord-sub-dt">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="ord-sub-dot">•</span>
                        <span className="ord-sub-act">{activeTab === 'buyer' ? 'Seller:' : 'Buyer:'} {activeTab === 'buyer' ? `${order.seller_first_name} ${order.seller_last_name || ''}` : `${order.buyer_first_name} ${order.buyer_last_name || ''}`}</span>
                      </div>
                      {order.selected_plan_type && (
                        <div className="ord-itm-plan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '6px', fontSize: '0.75rem', fontWeight: '600', color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '2px 8px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '2px' }}><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                          Plan: {order.selected_plan_type}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ord-itm-end">
                    {getActionLayer(order, activeTab === 'buyer')}
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalItems={filteredList.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />

          </div>

        </div>
      </main>

      {/* Review Modal Overlay dynamically toggling natively */}
      {reviewModalOpen && (
        <div className="ord-modal-overlay">
          <div className="ord-modal-box">
            <div className="ord-modal-hdr">
              <h3 className="ord-modal-title">Write a Review</h3>
              <button className="ord-modal-close" onClick={() => setReviewModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="ord-stars-grp">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`ord-star ${star <= (ratingHover || rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  onClick={() => setRating(star)}
                  width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              ))}
            </div>

            <textarea
              className="ord-review-txt"
              placeholder="Share your experience..."
              rows="4"
            ></textarea>

            <button className="ord-btn-submit" onClick={handleSubmitReview}>Submit Review</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
