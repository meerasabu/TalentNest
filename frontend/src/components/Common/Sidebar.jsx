import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, handlePrefix }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header" onClick={() => navigate('/index', { state: { user } })} style={{cursor: 'pointer'}}>
        <div className="sidebar-logo-icon">T</div>
        <span className="sidebar-logo-text">TalentNest.</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h4 className="nav-heading">MENU</h4>
          <ul className="nav-list">
            <li className={`nav-item ${location.pathname === '/index' ? 'active' : ''}`} onClick={() => navigate('/index', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Overview
            </li>
            <li className={`nav-item ${location.pathname === '/marketplace' ? 'active' : ''}`} onClick={() => navigate('/marketplace', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              Marketplace
            </li>
            <li className={`nav-item ${location.pathname === '/skills' ? 'active' : ''}`} onClick={() => navigate('/skills' ? 'active' : (location.pathname === '/skills' ? 'active' : ''))} onClick={() => navigate('/skills', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              Skills
            </li>
            <li className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`} onClick={() => navigate('/services', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              Services
            </li>
            <li className={`nav-item ${location.pathname === '/orders' ? 'active' : ''}`} onClick={() => navigate('/orders', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Orders
            </li>
          </ul>
        </div>
        <div className="nav-section">
          <h4 className="nav-heading">PERSONAL</h4>
          <ul className="nav-list">
            <li className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              My Profile
            </li>
            <li className={`nav-item ${location.pathname === '/wishlist' ? 'active' : ''}`} onClick={() => navigate('/wishlist', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              Wishlist
            </li>
            <li className={`nav-item ${location.pathname === '/chat' || location.pathname === '/messages' ? 'active' : ''}`} onClick={() => navigate('/chat', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              Messages
            </li>
            <li className={`nav-item ${location.pathname === '/notifications' ? 'active' : ''}`} onClick={() => navigate('/notifications', { state: { user } })}>
              <svg className="nav-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              Notifications
            </li>
            <li className="nav-item text-danger" onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              navigate('/');
            }}>
              <svg className="nav-icon logout-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Logout
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-user-footer">
        <img src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : "https://placehold.co/40x40"} alt="Profile" className="user-avatar" />
        <div className="user-details">
          <span className="user-name">{user.firstName} {user.lastName || ''}</span>
          <span className="user-handle">{handlePrefix}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
