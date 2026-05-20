import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ activePage }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    )},
    { id: 'students', label: 'Students', path: '/admin/students', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    )},
    { id: 'listings', label: 'Management', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    ), subItems: [
      { id: 'marketplace', label: 'Marketplace', path: '/admin/marketplace' },
      { id: 'skills', label: 'Skills', path: '/admin/skills' },
      { id: 'services', label: 'Services', path: '/admin/services' }
    ]},
    { id: 'orders', label: 'Orders & Requests', path: '/admin/orders', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    )},
    { id: 'chat', label: 'Chat Moderation', path: '/admin/chat', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    )},
    { id: 'reports', label: 'Reports', path: '#', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
    )},
    { id: 'verification', label: 'Verification', path: '#', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    )},
  ];

  const [openDropdown, setOpenDropdown] = React.useState(() => {
    const activeItem = navItems.find(item => 
      item.subItems && item.subItems.some(sub => sub.id === activePage)
    );
    return activeItem ? activeItem.id : null;
  });

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <span className="admin-logo-text">TalentNest</span>
        <span className="admin-logo-sub">Campus Moderation</span>
      </div>

      <nav className="admin-nav">
        <ul className="admin-nav-list">
          {navItems.map((item) => (
            <li key={item.id} className="nav-item-container">
              {item.subItems ? (
                <>
                  <div 
                    className={`admin-nav-item dropdown-toggle ${activePage === item.id || item.subItems.some(s => s.id === activePage) ? 'active' : ''}`}
                    onClick={() => toggleDropdown(item.id)}
                  >
                    <div className="nav-item-content">
                      {item.icon}
                      {item.label}
                    </div>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      className={`dropdown-chevron ${openDropdown === item.id ? 'open' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  <ul className={`admin-sub-nav ${openDropdown === item.id ? 'show' : ''}`}>
                    {item.subItems.map((sub) => (
                      <li key={sub.id}>
                        <Link 
                          to={sub.path} 
                          className={`admin-sub-nav-item ${activePage === sub.id ? 'active' : ''}`}
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <Link 
                  to={item.path} 
                  className={`admin-nav-item ${activePage === item.id ? 'active' : ''}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: item.path === '#' ? 'default' : 'pointer' }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-nav-item logout-item" onClick={handleLogout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
