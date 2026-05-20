import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract user and token for persistent sessions
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  if (!user || !token || token === 'undefined') {
    return <Navigate to="/login" />;
  }
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'products');

  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [userServices, setUserServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = user?.id || 1;
        const [prodRes, skillRes, servRes] = await Promise.all([
          api.get(`/users/${uid}/products`),
          api.get(`/users/${uid}/skills`),
          api.get(`/users/${uid}/services`)
        ]);
        
        if (prodRes.data.success) setUserProducts(prodRes.data.products);
        if (skillRes.data.success) setUserSkills(skillRes.data.skills);
        if (servRes.data.success) setUserServices(servRes.data.services);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoadingProducts(false);
        setLoadingSkills(false);
        setLoadingServices(false);
      }
    };
    fetchUserData();
  }, [user?.id]);

  const [openMenuId, setOpenMenuId] = useState(null);
  const [openMenuType, setOpenMenuType] = useState(null);

  const toggleMenu = (e, id, type) => {
    e.stopPropagation();
    if (openMenuId === id && openMenuType === type) {
      setOpenMenuId(null);
      setOpenMenuType(null);
    } else {
      setOpenMenuId(id);
      setOpenMenuType(type);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setOpenMenuType(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleUpdateStatus = async (id, type, newStatus) => {
    try {
      const endpoint = `/${type}/${id}/status`;
      const res = await api.patch(endpoint, { status: newStatus });
      if (res.data.success) {
        // Update local state
        if (type === 'products') {
          setUserProducts(userProducts.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } else if (type === 'skills') {
          setUserSkills(userSkills.map(s => s.id === id ? { ...s, status: newStatus } : s));
        } else if (type === 'services') {
          setUserServices(userServices.map(srv => srv.id === id ? { ...srv, status: newStatus } : srv));
        }
      }
    } catch (err) {
      console.error(`Error updating ${type} status:`, err);
      alert('Failed to update status.');
    }
  };

  const handleDeleteItem = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    try {
      const endpoint = `/${type}/${id}`;
      const res = await api.delete(endpoint);
      if (res.data.success) {
        // Update local state
        if (type === 'products') {
          setUserProducts(userProducts.filter(p => p.id !== id));
        } else if (type === 'skills') {
          setUserSkills(userSkills.filter(s => s.id !== id));
        } else if (type === 'services') {
          setUserServices(userServices.filter(srv => srv.id !== id));
        }
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert('Failed to delete item.');
    }
  };

  // Hardcoded structure rendering logic mimicking specific visual boundaries completely!
  const renderTabContent = () => {
    if (activeTab === 'products') {
      return (
        <div className="prof-skill-grid">
          {userProducts.map(prod => (
            <div key={prod.id} className="prof-skill-card" onClick={() => navigate(`/product/${prod.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {prod.image_urls && prod.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${prod.image_urls[0]}`} alt={prod.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/e2e8f0/475569?text=Prod" alt="Product" className="prof-sk-ava" />
                )}
                {prod.status === 'Sold' && <div className="status-overlay">SOLD</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{prod.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, prod.id, 'products')}>⋮</button>
                   {openMenuId === prod.id && openMenuType === 'products' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: prod, type: 'product' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       <button className="dropdown-item" onClick={() => handleUpdateStatus(prod.id, 'products', prod.status === 'Sold' ? 'Available' : 'Sold')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         {prod.status === 'Sold' ? 'Make Available' : 'Mark as Sold'}
                       </button>
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(prod.id, 'products')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat" style={{ color: '#64748b', fontSize: '0.85rem' }}>{prod.category}</span>
                 <div className="sk-btm-row" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '1.1rem' }}>₹{prod.price}</span>
                   {prod.status === 'Available' ? (
                     <span className="act-pill" style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>ACTIVE</span>
                   ) : (
                     <span className="cmpt-pill" style={{ backgroundColor: '#475569', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>SOLD</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userProducts.length === 0 && !loadingProducts && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No products found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'skills') {
      return (
        <div className="prof-skill-grid">
          {userSkills.map(skill => (
            <div key={skill.id} className="prof-skill-card" onClick={() => navigate(`/skill/${skill.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {skill.image_urls && skill.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${skill.image_urls[0]}`} alt={skill.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/3b82f6/fff?text=Skill" alt="Skill" className="prof-sk-ava" />
                )}
                {skill.status === 'Completed' && <div className="status-overlay">DONE</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{skill.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, skill.id, 'skills')}>⋮</button>
                   {openMenuId === skill.id && openMenuType === 'skills' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: skill, type: 'skill' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       <button className="dropdown-item" onClick={() => handleUpdateStatus(skill.id, 'skills', skill.status === 'Completed' ? 'Active' : 'Completed')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         {skill.status === 'Completed' ? 'Make Active' : 'Mark Completed'}
                       </button>
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(skill.id, 'skills')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat">{skill.category}</span>
                 <div className="sk-btm-row">
                   <span className="exc-lbl">⚡ {skill.charge_type || 'Exchange'}</span>
                   {skill.status === 'Active' ? (
                     <span className="act-pill">ACTIVE</span>
                   ) : (
                     <span className="cmpt-pill">{skill.status?.toUpperCase() || 'COMPLETED'}</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userSkills.length === 0 && !loadingSkills && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No skills found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'services') {
      return (
        <div className="prof-skill-grid">
          {userServices.map(service => (
            <div key={service.id} className="prof-skill-card" onClick={() => navigate(`/service/${service.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
              <div className="prof-img-container">
                {service.image_urls && service.image_urls.length > 0 ? (
                  <img src={`http://localhost:5000${service.image_urls[0]}`} alt={service.title} className="prof-sk-ava" />
                ) : (
                  <img src="https://placehold.co/90x90/1f2937/fff?text=Srvc" alt="Service" className="prof-sk-ava" />
                )}
                {service.status === 'Completed' && <div className="status-overlay">DONE</div>}
              </div>
              <div className="prof-sk-core">
                 <div className="prof-sk-titlerow">
                   <h4>{service.title}</h4>
                   <button className="prof-more-btn" onClick={(e) => toggleMenu(e, service.id, 'services')}>⋮</button>
                   {openMenuId === service.id && openMenuType === 'services' && (
                     <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                       <button className="dropdown-item" onClick={() => navigate('/create-listing', { state: { user, editItem: service, type: 'service' } })}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                         Edit Item
                       </button>
                       <button className="dropdown-item" onClick={() => handleUpdateStatus(service.id, 'services', service.status === 'Completed' ? 'Active' : 'Completed')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                         {service.status === 'Completed' ? 'Make Active' : 'Mark Completed'}
                       </button>
                       <button className="dropdown-item delete" onClick={() => handleDeleteItem(service.id, 'services')}>
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                       </button>
                     </div>
                   )}
                 </div>
                 <span className="sk-cat">{service.category}</span>
                 <div className="sk-btm-row">
                   <span className="price-lbl">💼 {service.standard_plan ? '₹'+service.standard_plan : 'Custom'}</span>
                   {service.status === 'Active' ? (
                     <span className="act-pill">ACTIVE</span>
                   ) : (
                     <span className="cmpt-pill">{service.status?.toUpperCase() || 'COMPLETED'}</span>
                   )}
                 </div>
              </div>
            </div>
          ))}
          {userServices.length === 0 && !loadingServices && (
            <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#6B7280'}}>
              No services found.
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'reviews') {
      return (
        <div className="prof-reviews-list">
          <div className="prof-rev-box">
             <div className="prof-rev-header">
               <div className="rev-user-grp">
                 <img src="https://placehold.co/40x40" alt="Reviewer" className="rev-ava" />
                 <div className="rev-user-txt">
                   <h4>Emma Wilson</h4>
                   <div className="rev-stars">
                     ⭐ ⭐ ⭐ ⭐ ⭐ <span>1 week ago</span>
                   </div>
                 </div>
               </div>
               <div className="rev-chk-pill">
                 <span className="rev-ver-chk">✔ Verified Interaction</span>
                 <span className="sub-act-lbl">Completed interaction</span>
               </div>
             </div>
             <p className="rev-desc">Super smooth transaction. The product was exactly as described and we met up right on campus.</p>
          </div>

          <div className="prof-rev-box">
             <div className="prof-rev-header">
               <div className="rev-user-grp">
                 <img src="https://placehold.co/40x40" alt="Reviewer" className="rev-ava" />
                 <div className="rev-user-txt">
                   <h4>David Martinez</h4>
                   <div className="rev-stars">
                     ⭐ ⭐ ⭐ ⭐ ⭐ <span>1 month ago</span>
                   </div>
                 </div>
               </div>
               <div className="rev-chk-pill">
                 <span className="rev-ver-chk">✔ Verified Interaction</span>
                 <span className="sub-act-lbl">Completed interaction</span>
               </div>
             </div>
             <p className="rev-desc">Great tutor! Explained everything very clearly.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Primary Window Bounds perfectly wrapping UI constraints */}
      <main className="dashboard-main prof-main">
        <header className="main-header prof-hdr-bg">
          <div className="search-bar-placeholder" style={{flex: 1}}></div>
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

        <div className="content-scrollable prof-scrollable">
          
           {/* Top Floating Context Container */}
           <div className="prof-top-block">
              <img src={user.bannerImage ? `http://localhost:5000${user.bannerImage}` : "https://placehold.co/1200x260/0284c7/ecf0f1"} alt="Banner" className="prof-banner" />
              <div className="prof-info-sect">
                <div className="prof-avatar-halo">
                  <img src={user.profileImage ? `http://localhost:5000${user.profileImage}` : "https://placehold.co/150x150"} alt="Avatar" className="prof-main-ava" />
                </div>
                
                <div className="prof-desc-grp">
                   <div className="prof-name-row">
                      <div className="prof-title-bnd">
                         <h1>{user.firstName} {user.lastName}</h1>
                         <p className="prof-dept-lbl">{user.department || 'Student'}, {user.graduationYear || 'N/A'}</p>
                      </div>
                      <button className="prof-btn-purp" onClick={() => navigate('/edit-profile', { state: { user } })}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> 
                        Edit Profile
                      </button>
                   </div>
                   
                   <div className="prof-lbl-row">
                      <span className="prof-icon-txt">⭐ 4.9 <span className="light-txt">(12 reviews)</span></span>
                      <span className="prof-icon-txt">📍 {user.campusLocation || 'Campus'}</span>
                      <span className="prof-icon-txt">📅 Joined Aug 2022</span>
                   </div>

                   <p className="prof-bio">{user.bio || "No bio added yet."}</p>
                </div>
              </div>
           </div>

           {/* Layout Split Body Map natively replicating exact bounds */}
           <div className="prof-split-view">
             
              <div className="prof-left-pane">
                 <div className="prof-tabs">
                    <button className={`prof-tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button>
                    <button className={`prof-tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
                    <button className={`prof-tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
                    <button className={`prof-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
                 </div>
                 
                 <div className="prof-tab-content">
                   {renderTabContent()}
                 </div>
              </div>

              {/* Fixed Right Activity Bar matching UI parameters neatly */}
              <div className="prof-right-pane">
                 <div className="prof-activity-card">
                    <h3 className="act-header"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Activity</h3>
                    
                    <div className="timeline-flow">
                       <div className="timeline-item">
                         <div className="tl-dot tl-grn"></div>
                         <div className="tl-txt">
                           <h4>You reviewed a service/product</h4>
                           <span>Just now</span>
                         </div>
                       </div>
                       
                       <div className="timeline-item">
                         <div className="tl-line"></div>
                         <div className="tl-dot tl-purp"></div>
                         <div className="tl-txt">
                           <h4>Listed a new product</h4>
                           <span>2h ago</span>
                         </div>
                       </div>
                       
                       <div className="timeline-item">
                         <div className="tl-line"></div>
                         <div className="tl-dot tl-gry"></div>
                         <div className="tl-txt">
                           <h4>Updated profile bio</h4>
                           <span>1d ago</span>
                         </div>
                       </div>

                       <div className="timeline-item">
                         <div className="tl-line"></div>
                         <div className="tl-dot tl-blu"></div>
                         <div className="tl-txt">
                           <h4>Completed a service</h4>
                           <span>1w ago</span>
                         </div>
                       </div>
                    </div>
                 </div>
              </div>

           </div>

        </div>
      </main>
    </div>
  );
};

export default Profile;
