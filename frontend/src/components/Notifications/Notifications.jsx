import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Sidebar from '../Common/Sidebar';
import Pagination from '../Common/Pagination';
import '../Dashboard/Index.css';
import './Notifications.css';
import Header from '../Common/Header';

const Notifications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user') || 'null');

  const handlePrefix = user?.email ? user.email.split('@')[0].toUpperCase() : 'STUDENT';
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filters = ['All', 'Orders', 'Skill Requests', 'Service Bookings', 'Admin'];

  const [notificationsData, setNotificationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = user ? localStorage.getItem(`deleted_notifications_${user.id}`) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const formatTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  useEffect(() => {
    const fetchAllNotifications = async () => {
      try {
        const [buyerRes, sellerRes] = await Promise.all([
          api.get(`/orders/buyer/${user.id}`),
          api.get(`/orders/seller/${user.id}`)
        ]);

        let combined = [];

        if (buyerRes.data.success) {
          const buyerNotifs = buyerRes.data.orders.map(o => ({
            id: `buyer-${o.id}`,
            type: o.status === 'Pending' ? 'order_sent' : (o.status === 'Accepted' ? 'order_accepted' : 'order_declined'),
            title: o.status === 'Pending' ? 'Order Request Sent' : (o.status === 'Accepted' ? 'Order Accepted' : 'Order Declined'),
            description: o.status === 'Pending'
              ? `You sent a request for ${o.itemTitle}${o.selected_plan_type ? ` (${o.selected_plan_type} - ₹${o.selected_price || o.itemPrice})` : ''} to ${o.seller_first_name} ${o.seller_last_name || ''}.`
              : (o.status === 'Accepted'
                ? `Your request for ${o.itemTitle}${o.selected_plan_type ? ` (${o.selected_plan_type} - ₹${o.selected_price || o.itemPrice})` : ''} was accepted by ${o.seller_first_name}.`
                : `Your request for ${o.itemTitle} was declined.`),
            withPerson: `${o.seller_first_name} ${o.seller_last_name || ''}`,
            status: o.status.toUpperCase(),
            time: formatTime(o.updated_at || o.created_at),
            image: o.itemImage ? `http://localhost:5000${o.itemImage}` : `https://placehold.co/50x50/e2e8f0/cbd5e1?text=${o.item_type[0].toUpperCase()}`,
            hasChat: o.status !== 'Pending',
            itemType: o.item_type,
            createdAt: o.updated_at || o.created_at
          }));
          combined = [...combined, ...buyerNotifs];
        }

        if (sellerRes.data.success) {
          const sellerNotifs = sellerRes.data.orders.map(o => ({
            id: `seller-${o.id}`,
            type: o.item_type === 'skill' ? 'skill_request' : (o.item_type === 'service' ? 'booking_confirmed' : 'order_received'),
            title: o.item_type === 'skill' ? 'New Skill Request' : (o.item_type === 'service' ? 'New Service Booking' : 'New Order Request'),
            description: o.selected_plan_type
              ? `${o.buyer_first_name} requested ${o.itemTitle} (${o.selected_plan_type} - ₹${o.selected_price || o.itemPrice}).`
              : `${o.buyer_first_name} requested ${o.itemTitle}.`,
            withPerson: `${o.buyer_first_name} ${o.buyer_last_name || ''}`,
            status: o.status.toUpperCase(),
            time: formatTime(o.updated_at || o.created_at),
            image: o.itemImage ? `http://localhost:5000${o.itemImage}` : null,
            iconType: o.item_type === 'skill' ? 'purple' : 'blue',
            iconSvg: o.item_type === 'skill'
              ? <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
              : <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>,
            hasAcceptDecline: o.status === 'Pending',
            hasChat: o.status === 'Accepted',
            itemType: o.item_type,
            createdAt: o.updated_at || o.created_at
          }));
          combined = [...combined, ...sellerNotifs];
        }

        // Add mock admin notification
        const adminNotif = {
          id: 'admin-1',
          type: 'admin_announcement',
          title: 'System Update',
          description: 'TalentNest has been updated to version 2.0 with improved security.',
          withPerson: 'System Admin',
          status: 'INFO',
          time: '3 hours ago',
          iconType: 'dark',
          iconSvg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
          hasChat: false,
          itemType: 'admin',
          createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
        };
        combined = [...combined, adminNotif];

        combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotificationsData(combined);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNotifications();
  }, [user.id]);

  const deleteNotifications = (idsToDelete) => {
    const updatedDeleted = [...new Set([...deletedIds, ...idsToDelete])];
    setDeletedIds(updatedDeleted);
    localStorage.setItem(`deleted_notifications_${user.id}`, JSON.stringify(updatedDeleted));
    // Clear selection for deleted items
    setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredNotifications = notificationsData.filter(notif => {
    if (deletedIds.includes(notif.id)) return false;

    let matchesCategory = true;
    if (activeFilter === 'Admin') matchesCategory = notif.itemType === 'admin';
    else if (activeFilter === 'Orders') matchesCategory = notif.itemType === 'product';
    else if (activeFilter === 'Skill Requests') matchesCategory = notif.itemType === 'skill';
    else if (activeFilter === 'Service Bookings') matchesCategory = notif.itemType === 'service';

    if (!matchesCategory) return false;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const titleMatch = notif.title ? notif.title.toLowerCase().includes(term) : false;
      const descMatch = notif.description ? notif.description.toLowerCase().includes(term) : false;
      const typeMatch = notif.itemType ? notif.itemType.toLowerCase().includes(term) : false;
      const typeDetailMatch = notif.type ? notif.type.toLowerCase().includes(term) : false;
      const statusMatch = notif.status ? notif.status.toLowerCase().includes(term) : false;

      return titleMatch || descMatch || typeMatch || typeDetailMatch || statusMatch;
    }

    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const contentElement = document.querySelector('.content-scrollable');
    if (contentElement) contentElement.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filter changes
    setSelectedIds([]); // Reset selections
  }, [activeFilter]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search term changes
    setSelectedIds([]); // Reset selections
  }, [searchTerm]);

  const isAllSelected = filteredNotifications.length > 0 && filteredNotifications.every(notif => selectedIds.includes(notif.id));

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      const filteredIds = filteredNotifications.map(n => n.id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredNotifications.map(n => n.id);
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Layout Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <Header 
          user={user} 
          onSearchChange={setSearchTerm} 
          onSearch={(val) => setSearchTerm(val)} 
          searchPlaceholder="Search notifications..." 
        />

        {/* Notifications Content */}
        <div className="content-scrollable">
          <div className="notifications-main">
            <div className="notifications-page-header">
              <h1 className="notifications-page-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                Notifications
              </h1>
              <p className="notifications-subtitle">Stay updated on your campus activities.</p>
            </div>

            <div className="notifications-filter-container">
              {filters.map(filter => (
                <button
                  key={filter}
                  className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="notifications-bulk-actions-bar">
                <label className="bulk-select-all-label">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAllToggle}
                  />
                  <span>Select All ({filteredNotifications.length})</span>
                </label>
                
                <button 
                  className="bulk-delete-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected notifications?`)) {
                      deleteNotifications(selectedIds);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Selected ({selectedIds.length})
                </button>
              </div>
            )}

            <div className={`notifications-list ${selectedIds.length > 0 ? 'has-selection' : ''}`}>
              {loading ? (
                <div className="loading-placeholder">Loading your notifications...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="loading-placeholder">No notifications found.</div>
              ) : (
                paginatedNotifications.map(notif => {
                  return (
                    <div key={notif.id} className={`notification-card ${selectedIds.includes(notif.id) ? 'selected' : ''}`}>
                      {/* 1. Checkbox/Select Option */}
                      <div className="notif-select-wrapper">
                        <input 
                          type="checkbox" 
                          className="custom-checkbox"
                          checked={selectedIds.includes(notif.id)}
                          onChange={() => handleSelectToggle(notif.id)}
                        />
                      </div>

                      {/* 2. Image / Icon */}
                      {notif.image ? (
                        <div className="notif-avatar-container">
                          <img src={notif.image} alt={notif.title} />
                        </div>
                      ) : (
                        <div className={`notif-avatar-container icon-bg-${notif.iconType}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {notif.iconSvg}
                          </svg>
                        </div>
                      )}

                      {/* 3. Text details / Description */}
                      <div className="notif-text-content">
                        <h4 className="notif-title">{notif.title}</h4>
                        <p className="notif-desc">{notif.description}</p>
                        <p className="notif-with">With <span>{notif.withPerson}</span></p>
                      </div>

                      {/* 4. Status badge */}
                      <div className="notif-status-wrapper">
                        <span className={`notif-status-pill notif-status-${notif.status.toLowerCase()}`}>
                          {notif.status}
                        </span>
                      </div>

                      {/* 5. Time details */}
                      <span className="notif-time">{notif.time}</span>

                      {/* 6. Action buttons */}
                      <div className="notif-actions-wrapper">
                        {notif.status === 'PENDING' && !notif.hasAcceptDecline && (
                          <button className="notif-action-btn btn-dark" onClick={() => navigate('/orders', { state: { user } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            View Request
                          </button>
                        )}
                        {(notif.status === 'ACCEPTED' || notif.status === 'REJECTED') && notif.hasChat && (
                          <button className="notif-action-btn btn-dark" onClick={() => navigate('/chat', { state: { user } })}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            View in Chat
                          </button>
                        )}
                        {notif.hasAcceptDecline && (
                          <div className="notif-btn-row">
                            <button className="notif-action-btn btn-primary" onClick={() => navigate('/orders', { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              Accept
                            </button>
                            <button className="notif-action-btn btn-light" onClick={() => navigate('/orders', { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                              Decline
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 7. Single Delete option */}
                      <button 
                        className="notif-delete-single-btn" 
                        title="Delete notification"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this notification?")) {
                            deleteNotifications([notif.id]);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination 
              currentPage={currentPage}
              totalItems={filteredNotifications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
