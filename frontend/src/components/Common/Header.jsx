import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ 
  user, 
  showSearch = true, 
  onSearch, 
  onSearchChange, 
  searchPlaceholder = "Search products, skills, services..." 
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { state: { user } });
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  return (
    <header className="main-header" style={!showSearch ? { justifyContent: 'flex-end' } : {}}>
      {showSearch && (
        <div className="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
          </svg>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, margin: 0 }}>
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={searchQuery}
              onChange={handleInputChange}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
            />
          </form>
        </div>
      )}
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
  );
};

export default Header;
