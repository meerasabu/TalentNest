import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './ServiceDetails.css';
import Header from '../Common/Header';

const ServiceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await api.get(`/services/${id}`);
        if (response.data.success) {
          setService(response.data.service);
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  const handleOrderRequest = async () => {
    if (!selectedPlan) {
      alert('Please select a pricing plan (Basic Plan or Group/Premium Plan) before booking this service.');
      return;
    }
    const planPrice = selectedPlan === 'Basic Plan' ? service.standard_plan : service.group_plan;
    try {
      const res = await api.post('/orders', {
        buyerId: user.id || 5,
        sellerId: service.user_id,
        itemType: 'service',
        itemId: service.id,
        selectedPlanType: selectedPlan,
        selectedPrice: planPrice
      });
      if (res.data.success) {
        alert('Service booking sent successfully!');
        navigate('/orders', { state: { user } });
      }
    } catch (err) {
      console.error('Error sending booking request:', err);
      alert('Failed to send booking request.');
    }
  };

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading service details...</div>;
  }

  if (!service) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Service not found.</div>;
  }

  const mainImageUrl = service.image_urls && service.image_urls.length > 0 
    ? `http://localhost:5000${service.image_urls[0]}` 
    : 'https://placehold.co/1200x500/e6e3df/a39589?text=Service';

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Container */}
      <main className="dashboard-main service-details-main">
        {/* Header */}
        <Header user={user} />

        {/* Scrollable Content */}
        <div className="service-details-scroll">
          <div className="sd-viewer-wrapper">
            
            <div className="back-nav-sd" onClick={() => navigate('/services', { state: { user } })} title="Go Back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>

            {/* Banner Section */}
            <div className="sd-hero-banner">
              <img src={mainImageUrl} alt={service.title} className="sd-hero-img" />
              <div className="sd-hero-overlay">
                <span className="sd-hero-tag" style={{textTransform: 'uppercase'}}>{service.service_type}</span>
                <h1 className="sd-hero-title">{service.title}</h1>
                <div className="sd-hero-meta">
                  <span><span className="sd-rate-star">★</span> 0.0 (0 Reviews)</span>
                  <span>•</span>
                  <span><svg style={{display:'inline', marginRight:'4px', verticalAlign:'sub'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Professional Service</span>
                  <span>•</span>
                  <span className={`sd-avail-badge ${service.status === 'Active' ? 'active-badge' : 'completed-badge'}`} style={{padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: service.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: service.status === 'Active' ? '#10B981' : '#EF4444'}}>
                    {service.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="sd-content-grid">
              {/* Left Column */}
              <div className="sd-content-left">
                
                <div className="sd-section-block">
                  <h3>Service Overview</h3>
                  <p className="sd-about-text">
                    {service.description}
                  </p>
                </div>

                <div className="sd-section-block">
                  <h3>Pricing Packages</h3>
                  <div className="sd-pricing-grid">
                    {/* Standard Package */}
                    {service.standard_plan && (
                      <div 
                        className={`sd-pkg-card ${selectedPlan === 'Basic Plan' ? 'selected' : 'highlight'}`}
                        onClick={() => setSelectedPlan(selectedPlan === 'Basic Plan' ? null : 'Basic Plan')}
                      >
                        <span className="sd-pkg-ribbon">STANDARD</span>
                        <h4 className="sd-pkg-title">Basic Plan</h4>
                        <div className="sd-pkg-price">₹{service.standard_plan} <span className="sd-pkg-period"></span></div>
                        <ul className="sd-pkg-features">
                          <li><svg className="sd-chk-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Comprehensive Service</li>
                          <li><svg className="sd-chk-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Direct Communication</li>
                        </ul>
                      </div>
                    )}
                    {/* Group Package */}
                    {service.group_plan && (
                      <div 
                        className={`sd-pkg-card ${selectedPlan === 'Group/Premium Plan' ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan(selectedPlan === 'Group/Premium Plan' ? null : 'Group/Premium Plan')}
                      >
                        <h4 className="sd-pkg-title">Group/Premium Plan</h4>
                        <div className="sd-pkg-price">₹{service.group_plan} <span className="sd-pkg-period"></span></div>
                        <ul className="sd-pkg-features">
                          <li><svg className="sd-chk-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Extended Service</li>
                          <li><svg className="sd-chk-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Group Sessions</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reviews */}
                <div className="sd-section-block">
                  <h3>Reviews & Ratings</h3>
                  <div className="reviews-analysis-box" style={{backgroundColor: '#F9FAFB', borderRadius: '1rem', padding: '2rem', display: 'flex', gap: '4rem', alignItems: 'center', margin: '1rem 0 2rem 0'}}>
                    <div className="raa-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'}}>
                      <span className="raa-num" style={{fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1}}>4.9</span>
                      <span className="raa-stars" style={{color: '#FBBF24', letterSpacing: '0.1em'}}>★★★★★</span>
                      <span className="raa-desc" style={{fontSize: '0.75rem', color: '#6B7280'}}>42 reviews</span>
                    </div>
                    <div className="raa-right" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      {[
                        {s:5, p:95},
                        {s:4, p:5},
                        {s:3, p:0},
                        {s:2, p:0},
                        {s:1, p:0}
                      ].map(r => (
                        <div key={r.s} className="raa-row" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                          <span className="raa-rlab" style={{width: '30px', fontSize: '0.75rem', color: '#6B7280', textAlign: 'right'}}>{r.s} ★</span>
                          <div className="raa-track" style={{flex: 1, height: '6px', backgroundColor: '#E5E7EB', borderRadius: '999px'}}>
                            <div className="raa-fill" style={{height: '100%', backgroundColor: '#FBBF24', borderRadius: '999px', width: `${r.p}%`}}></div>
                          </div>
                          <span className="raa-rpct" style={{width: '30px', fontSize: '0.75rem', color: '#6B7280'}}>{r.p}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="review-card" style={{border: '1px solid #F3F4F6', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem'}}>
                    <div className="rev-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                      <div className="rev-user-grp" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img src="https://placehold.co/40x40/333/fff?text=RA" alt="Rachel A." style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                        <div className="rev-name-stack" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span className="rn-name" style={{fontWeight: 700, color: '#111827', fontSize: '0.875rem'}}>Rachel Adams</span>
                          <span className="rn-sub" style={{fontSize: '0.75rem', color: '#9CA3AF'}}>
                            <span style={{color: '#FBBF24'}}>★★★★★</span> 1 week ago
                          </span>
                        </div>
                      </div>
                      <div className="rev-verified-block" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                        <span className="rv-pill" style={{backgroundColor: '#ECFDF5', color: '#10B981', fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}><span className="green-dot" style={{width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block'}}></span> Verified Interaction</span>
                        <span className="rv-desc" style={{fontSize: '0.65rem', color: '#9CA3AF'}}>Completed service</span>
                      </div>
                    </div>
                    <p className="rev-msg" style={{fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: 0}}>
                      James was incredible! He made me feel so comfortable and the photos turned out amazing. Highly recommend for graduation shots!
                    </p>
                  </div>

                  <div className="review-card" style={{border: '1px solid #F3F4F6', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem'}}>
                    <div className="rev-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                      <div className="rev-user-grp" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img src="https://placehold.co/40x40/555/fff?text=TJ" alt="Tom J." style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                        <div className="rev-name-stack" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span className="rn-name" style={{fontWeight: 700, color: '#111827', fontSize: '0.875rem'}}>Tom Johnson</span>
                          <span className="rn-sub" style={{fontSize: '0.75rem', color: '#9CA3AF'}}>
                            <span style={{color: '#FBBF24'}}>★★★★★</span> 2 weeks ago
                          </span>
                        </div>
                      </div>
                      <div className="rev-verified-block" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                        <span className="rv-pill" style={{backgroundColor: '#ECFDF5', color: '#10B981', fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}><span className="green-dot" style={{width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block'}}></span> Verified Interaction</span>
                        <span className="rv-desc" style={{fontSize: '0.65rem', color: '#9CA3AF'}}>Completed service</span>
                      </div>
                    </div>
                    <p className="rev-msg" style={{fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: 0}}>
                      Professional service and amazing quality. Got my photos within 2 days! Perfect for LinkedIn and family.
                    </p>
                  </div>

                </div>
              </div>

              {/* Right Column */}
              <div className="sd-content-right">
                
                <div className="sd-seller-card">
                  <img src={service.profile_image ? `http://localhost:5000${service.profile_image}` : `https://placehold.co/80x80/222/fff?text=${service.first_name?.[0] || 'U'}${service.last_name?.[0] || ''}`} alt={service.first_name} className="sd-seller-avatar" style={{objectFit: 'cover'}} />
                  <h4 className="sd-seller-name">{service.first_name} {service.last_name}</h4>
                  <p className="sd-seller-role">Member since {new Date(service.created_at).getFullYear()}</p>
                  
                  <button 
                    className="sd-btn-primary" 
                    onClick={handleOrderRequest}
                    disabled={service.available_quantity === 0 || service.status !== 'Active'}
                    style={{
                      opacity: (service.available_quantity === 0 || service.status !== 'Active') ? 0.5 : 1,
                      cursor: (service.available_quantity === 0 || service.status !== 'Active') ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Book Service
                  </button>
                  
                  <ul className="sd-bullets">
                    <li>Track your booking in Orders/ Notifications.</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Similar Services */}
            <div className="sd-similar-head">
              <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0}}>Similar Services</h2>
              <span className="sd-view-all" onClick={() => navigate('/services', { state: { user }})}>View all ›</span>
            </div>
            
            <div className="sd-similar-grid">
              {[
                { title: "Resume Review & Consulting", cat: "Free", rate: "Free", bg: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60", author: "Career Services" },
                { title: "Professional Headshots", cat: "₹30", rate: "₹30", bg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60", author: "Studio Pro" },
                { title: "Campus Tour Guide", cat: "₹20/hr", rate: "₹20/hr", bg: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60", author: "Student Ambassadors" }
              ].map((sim, i) => (
                <div key={i} className="sd-sim-card">
                  <img src={sim.bg} className="sd-sim-img" alt={sim.title} />
                  <div className="sd-sim-overlay">
                    <h4 className="sd-sim-title">{sim.title}</h4>
                    <div className="sd-sim-bottom">
                      <span className="sd-sim-author">by {sim.author}</span>
                      <span className="sd-sim-rate">{sim.rate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetails;
