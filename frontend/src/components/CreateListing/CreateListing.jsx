import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Dashboard/Index.css'; 
import './CreateListing.css';
import Header from '../Common/Header';

const CreateListing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const initialTab = location.state?.initialTab || 'product';

  const [isEditMode, setIsEditMode] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : ''; 


  useEffect(() => {
    if (location.state?.editItem) {
      const item = location.state.editItem;
      const type = location.state.type; // 'product', 'skill', or 'service'
      
      setIsEditMode(true);
      setEditItemId(item.id);
      setActiveTab(type);
      
      setFormData({
        title: item.title || '',
        description: item.description || '',
        price: item.price || item.hourly_rate || '',
        condition: item.condition || 'New',
        category: item.category || '',
        chargeType: item.charge_type || 'Paid',
        skillType: item.skill_type || 'Online',
        availableTimeSlot: item.available_time_slot || '',
        serviceType: item.service_type || '',
        standardPlan: item.standard_plan || '',
        groupPlan: item.group_plan || '',
        quantity: item.quantity || 1
      });
      
      if (item.available_time_slot) {
        setTimeSlots(item.available_time_slot.split(', '));
      } else {
        setTimeSlots(['']);
      }
      
      if (item.image_urls) {
        setExistingImages(item.image_urls);
        setPreviews(item.image_urls.map(url => `http://localhost:5000${url}`));
      }
    } else if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab);
    }
  }, [location.state]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    condition: 'New',
    category: '', 
    chargeType: 'Paid',
    skillType: 'Online',
    availableTimeSlot: '',
    serviceType: '',
    standardPlan: '',
    groupPlan: '',
    quantity: 1
  });

  const [timeSlots, setTimeSlots] = useState(['']);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleTabChange = (tab) => {
    if (isEditMode) return; // Prevent changing tab in edit mode
    setActiveTab(tab);
    setMessage(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages(prev => {
        const newImages = [...prev, ...selectedFiles].slice(0, 4 - existingImages.length);
        const newPreviews = [
          ...existingImages.map(url => `http://localhost:5000${url}`),
          ...newImages.map(file => URL.createObjectURL(file))
        ];
        setPreviews(newPreviews);
        return newImages;
      });
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    if (indexToRemove < existingImages.length) {
      // Removing an existing image
      const updatedExisting = existingImages.filter((_, idx) => idx !== indexToRemove);
      setExistingImages(updatedExisting);
      setPreviews([
        ...updatedExisting.map(url => `http://localhost:5000${url}`),
        ...images.map(file => URL.createObjectURL(file))
      ]);
    } else {
      // Removing a newly added image
      const relativeIdx = indexToRemove - existingImages.length;
      setImages(prev => {
        const newImages = prev.filter((_, idx) => idx !== relativeIdx);
        setPreviews([
          ...existingImages.map(url => `http://localhost:5000${url}`),
          ...newImages.map(file => URL.createObjectURL(file))
        ]);
        return newImages;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const data = new FormData();
    data.append('userId', user?.id || 1);
    data.append('title', formData.title);
    data.append('description', formData.description);
    
    if (isEditMode) {
      data.append('existingImages', JSON.stringify(existingImages));
    }

    images.forEach((img) => {
      data.append('images', img);
    });

    let endpoint = 'http://localhost:5000/api/';
    let method = isEditMode ? 'put' : 'post';

    if (activeTab === 'product' || activeTab === 'products') {
      endpoint += isEditMode ? `products/${editItemId}` : 'products';
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('condition', formData.condition);
      data.append('quantity', formData.quantity);
    } else if (activeTab === 'skill' || activeTab === 'skills') {
      endpoint += isEditMode ? `skills/${editItemId}` : 'skills';
      data.append('category', formData.category);
      data.append('chargeType', formData.chargeType);
      data.append('availableTimeSlot', timeSlots.filter(s => s.trim() !== '').join(', '));
      data.append('hourlyRate', formData.chargeType === 'Paid' ? formData.price : 0);
      data.append('skillType', formData.skillType);
    } else if (activeTab === 'service' || activeTab === 'services') {
      endpoint += isEditMode ? `services/${editItemId}` : 'services';
      data.append('serviceType', formData.serviceType);
      data.append('standardPlan', formData.standardPlan);
      data.append('groupPlan', formData.groupPlan);
    }

    try {
      const response = await api({
        method: method,
        url: endpoint,
        data: data,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: `Successfully ${isEditMode ? 'updated' : 'published'} your ${activeTab}!` });
      setTimeout(() => navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } }), 2000);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `Failed to ${isEditMode ? 'update' : 'create'} listing. Please try again.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Layout matching IndexDashboard */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header" onClick={() => navigate('/index', { state: { user } })} style={{cursor: 'pointer'}}>
          <div className="sidebar-logo-icon">T</div>
          <span className="sidebar-logo-text">TalentNest.</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-heading">MENU</h4>
            <ul className="nav-list">
              <li className="nav-item" onClick={() => navigate('/index', { state: { user } })} style={{cursor: 'pointer'}}>Overview</li>
              <li className="nav-item" onClick={() => navigate('/marketplace', { state: { user } })} style={{cursor: 'pointer'}}>Marketplace</li>
              <li className="nav-item" onClick={() => navigate('/skills', { state: { user } })} style={{cursor: 'pointer'}}>Skills</li>
              <li className="nav-item" onClick={() => navigate('/services', { state: { user } })} style={{cursor: 'pointer'}}>Services</li>
              <li className="nav-item" onClick={() => navigate('/orders', { state: { user } })} style={{cursor: 'pointer'}}>Orders</li>
            </ul>
          </div>
          <div className="nav-section">
            <h4 className="nav-heading">PERSONAL</h4>
            <ul className="nav-list">
              <li className="nav-item" onClick={() => navigate('/profile', { state: { user } })} style={{cursor: 'pointer'}}>My Profile</li>
              <li className="nav-item" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>Wishlist</li>
              <li className="nav-item">Messages</li>
              <li className="nav-item" onClick={() => navigate('/notifications', { state: { user } })} style={{cursor: 'pointer'}}>Notifications</li>
              <li className="nav-item text-danger" onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/');
              }} style={{cursor: 'pointer'}}>
                <svg className="nav-icon logout-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
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

      {/* Main Layout Area */}
      <main className="dashboard-main create-listing-main">
        {/* Top Header */}
        <Header user={user} />

        {/* Page Content Map */}
        <div className="content-scrollable create-listing-scroll">
          <div className="create-listing-wrapper">
            <span className="back-nav" onClick={() => navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } })}>
              ← Back
            </span>
            <h1 className="mockup-title">{isEditMode ? 'Edit Listing' : 'Create New Listing'}</h1>
            <p className="mockup-subtitle">{isEditMode ? 'Update your offering for the campus community.' : 'What are you offering to the campus community today?'}</p>
            
            {/* Pill Tab Switcher */}
            <div className="mockup-tab-switcher">
              <button 
                className={`mockup-tab ${activeTab === 'product' ? 'active' : ''}`} 
                onClick={() => handleTabChange('product')} type="button"
              >
                <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> 
                   Product
                </div>
              </button>
              <button 
                className={`mockup-tab ${activeTab === 'skill' ? 'active' : ''}`} 
                onClick={() => handleTabChange('skill')} type="button"
              >
                 <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> 
                   Skill
                </div>
              </button>
              <button 
                className={`mockup-tab ${activeTab === 'service' ? 'active' : ''}`} 
                onClick={() => handleTabChange('service')} type="button"
              >
                <div style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg> 
                   Service
                </div>
              </button>
            </div>

            {message && (
              <div className={`message-banner ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Inner Form Card */}
            <form onSubmit={handleSubmit} className="mockup-form-card">
              
              {/* Photo Section */}
              <div className="form-group">
                <label className="mockup-label">Photos</label>
                <div className="mockup-photo-area">
                  
                  {previews.map((src, idx) => (
                    <div key={idx} className="photo-thumbnail relative-box">
                      <img src={src} alt={`Preview ${idx + 1}`} />
                      <button type="button" className="remove-img-btn" onClick={() => handleRemoveImage(idx)} title="Remove Image">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  ))}

                  {/* Add Ghost Placeholder if < 4 */}
                  {previews.length < 4 && (
                    <>
                      <div className="photo-drop-zone" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="imageUpload" 
                          onChange={handleImageChange} 
                          className="file-input" 
                          multiple 
                        />
                        <label htmlFor="imageUpload" className="upload-trigger" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0}}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="M12 15V8"/><path d="m9 11 3-3 3 3"/></svg>
                          <span className="upload-text" style={{marginTop: '8px'}}>Upload</span>
                        </label>
                      </div>
                      {previews.length === 0 && (
                        <div className="photo-placeholder-ghost">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </div>
                      )}
                    </>
                  )}
                  
                </div>
                <p className="photo-helper-text">Add up to 4 high-quality photos. First image will be the cover.</p>
              </div>

              {/* Dynamic Fields */}
              
              <div className="form-group">
                <label className="mockup-label">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Name</label>
                <input 
                  type="text" 
                  name="title"
                  className="mockup-input"
                  placeholder={`e.g. ${activeTab === 'product' ? 'Sony WH-1000XM4' : activeTab === 'skill' ? 'Advanced Python Tutoring' : 'Laptop Repair'}`} 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>

              {activeTab === 'product' && (
                <div className="mockup-split-row">
                  <div className="form-group half">
                    <label className="mockup-label">Category</label>
                    <select name="category" className="mockup-input" value={formData.category} onChange={handleInputChange} required>
                      <option value="" disabled>Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Books & Notes">Books & Notes</option>
                      <option value="Hostel Essentials">Hostel Essentials</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Handmade">Handmade</option>
                      <option value="Stationery">Stationery</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label className="mockup-label">Price</label>
                    <div className="price-input-wrapper">
                      <span className="price-symbol">₹</span>
                      <input type="number" name="price" className="mockup-input price-input" placeholder="0.00" value={formData.price} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'product' && (
                <div className="form-group" style={{maxWidth: '200px'}}>
                  <label className="mockup-label">Quantity</label>
                  <input type="number" name="quantity" className="mockup-input" min="1" value={formData.quantity} onChange={handleInputChange} required />
                </div>
              )}

              {activeTab === 'skill' && (
                <>
                  <div className="form-group">
                    <label className="mockup-label">Category</label>
                    <select name="category" className="mockup-input" value={formData.category} onChange={handleInputChange} required>
                      <option value="" disabled>Select Category</option>
                      <option value="Programming">Programming</option>
                      <option value="Languages">Languages</option>
                      <option value="Design">Design</option>
                      <option value="Music">Music</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Academics">Academics</option>
                      <option value="Communication Skills">Communication Skills</option>
                    </select>
                  </div>

                  <div className="mockup-split-row">
                    <div className="form-group half">
                      <label className="mockup-label">Charge</label>
                      <select name="chargeType" className="mockup-input" value={formData.chargeType} onChange={handleInputChange} required>
                        <option value="Paid">Paid</option>
                        <option value="Free">Free</option>
                      </select>
                    </div>
                    <div className="form-group half">
                      <label className="mockup-label">Session Type</label>
                      <select name="skillType" className="mockup-input" value={formData.skillType} onChange={handleInputChange} required>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                  </div>

                  {formData.chargeType === 'Paid' && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="mockup-label">Hourly Rate (₹)</label>
                      <div className="price-input-wrapper">
                        <span className="price-symbol">₹</span>
                        <input 
                          type="number" 
                          name="price" 
                          className="mockup-input price-input" 
                          placeholder="e.g. 150.00" 
                          value={formData.price} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="mockup-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span>Available Time Slots</span>
                      <button 
                        type="button" 
                        onClick={() => setTimeSlots([...timeSlots, ''])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#4F46E5',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EEF2FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Time Slot
                      </button>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {timeSlots.map((slot, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                              type="text" 
                              className="mockup-input" 
                              placeholder="e.g. Weekends 10AM-2PM" 
                              value={slot} 
                              onChange={(e) => {
                                const newSlots = [...timeSlots];
                                newSlots[index] = e.target.value;
                                setTimeSlots(newSlots);
                              }} 
                              required 
                              style={{ paddingLeft: '2.75rem' }}
                            />
                            <svg 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="#9CA3AF" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                              style={{ position: 'absolute', left: '1.15rem', top: '50%', transform: 'translateY(-50%)' }}
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                          </div>
                          {timeSlots.length > 1 && (
                            <button 
                              type="button" 
                              className="remove-slot-btn"
                              onClick={() => setTimeSlots(timeSlots.filter((_, idx) => idx !== index))}
                              style={{
                                background: '#FEF2F2',
                                color: '#EF4444',
                                border: '1px solid #FEE2E2',
                                padding: '0.85rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEE2E2';
                                e.currentTarget.style.borderColor = '#FCA5A5';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FEF2F2';
                                e.currentTarget.style.borderColor = '#FEE2E2';
                              }}
                              title="Remove time slot"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'service' && (
                <>
                  <div className="form-group">
                    <label className="mockup-label">Service Type</label>
                    <select name="serviceType" className="mockup-input" value={formData.serviceType} onChange={handleInputChange} required>
                      <option value="" disabled>Select Service Type</option>
                      <option value="Design">Design</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Writing">Writing</option>
                      <option value="Errands">Errands</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Tech Support">Tech Support</option>
                      <option value="Photography">Photography</option>
                      <option value="Tutoring">Tutoring</option>
                      <option value="Event Help">Event Help</option>
                    </select>
                  </div>
                  <div className="mockup-split-row">
                    <div className="form-group half">
                      <label className="mockup-label">Standard Plan (₹)</label>
                      <div className="price-input-wrapper">
                        <span className="price-symbol">₹</span>
                        <input type="number" name="standardPlan" className="mockup-input price-input" placeholder="0.00" value={formData.standardPlan} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="form-group half">
                      <label className="mockup-label">Group Plan / hr (₹) (Optional)</label>
                      <div className="price-input-wrapper">
                        <span className="price-symbol">₹</span>
                        <input type="number" name="groupPlan" className="mockup-input price-input" placeholder="0.00" value={formData.groupPlan} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="mockup-label">Description</label>
                <textarea 
                  name="description"
                  className="mockup-input textarea"
                  placeholder="Describe what you're offering in detail..." 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows="4"
                  required 
                />
              </div>

              {/* Form Footer */}
              <div className="mockup-form-actions">
                <span className="cancel-btn" onClick={() => navigate(isEditMode ? '/profile' : '/index', { state: { user, activeTab: isEditMode ? `${activeTab}s` : undefined } })}>Cancel</span>
                <button type="submit" className="mockup-publish-btn" disabled={loading}>
                   {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Save Changes' : `Publish ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`)}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateListing;
