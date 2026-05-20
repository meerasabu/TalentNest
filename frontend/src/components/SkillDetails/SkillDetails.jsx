import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './SkillDetails.css';
import Header from '../Common/Header';

const SkillDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const response = await api.get(`/skills/${id}`);
        if (response.data.success) {
          setSkill(response.data.skill);
        }
      } catch (error) {
        console.error("Error fetching skill details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSkill();
  }, [id]);

  const handleOrderRequest = async () => {
    try {
      const res = await api.post('/orders', {
        buyerId: user.id || 5,
        sellerId: skill.user_id,
        itemType: 'skill',
        itemId: skill.id
      });
      if (res.data.success) {
        alert('Session request sent successfully!');
        navigate('/orders', { state: { user } });
      }
    } catch (err) {
      console.error('Error sending order request:', err);
      alert('Failed to send session request.');
    }
  };

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading skill details...</div>;
  }

  if (!skill) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Skill not found.</div>;
  }

  const mainImageUrl = skill.image_urls && skill.image_urls.length > 0 
    ? `http://localhost:5000${skill.image_urls[0]}` 
    : 'https://placehold.co/1200x500/e6e3df/a39589?text=Skill';

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Container */}
      <main className="dashboard-main skill-details-main">
        {/* Header */}
        <Header user={user} />

        {/* Scrollable Content */}
        <div className="skill-details-scroll">
          <div className="sk-viewer-wrapper">
            
            <div className="back-nav-sk" onClick={() => navigate('/skills', { state: { user } })} title="Go Back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>

            {/* Banner Section */}
            <div className="sk-hero-banner">
              <img src={mainImageUrl} alt={skill.title} className="sk-hero-img" />
              <div className="sk-hero-overlay">
                <span className="sk-hero-tag" style={{textTransform: 'uppercase'}}>{skill.category}</span>
                <h1 className="sk-hero-title">{skill.title}</h1>
                <div className="sk-hero-meta">
                  <span><span className="sk-rate-star">★</span> 0.0 (0 Reviews)</span>
                  <span>•</span>
                  <span><svg style={{display:'inline', marginRight:'4px', verticalAlign:'sub'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> {skill.skill_type || 'Online'} Sessions</span>
                  <span>•</span>
                  <span className={`sk-avail-badge ${skill.status === 'Active' ? 'active-badge' : 'completed-badge'}`} style={{padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', backgroundColor: skill.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: skill.status === 'Active' ? '#10B981' : '#EF4444'}}>
                    {skill.status?.toUpperCase() || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="sk-content-grid">
              {/* Left Column */}
              <div className="sk-content-left">
                
                <div className="sk-section-block">
                  <h3>About this skill</h3>
                  <p className="sk-about-text">
                    {skill.description}
                  </p>
                </div>

                <div className="sk-section-block">
                  <h3>Availability</h3>
                  <div className="sk-availability-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {skill.available_time_slot ? (
                      skill.available_time_slot.split(', ').map((slot, index) => (
                        <span key={index} className="sk-avail-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="sk-avail-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg className="sk-avail-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Flexible Scheduling
                      </span>
                    )}
                  </div>
                </div>

                {/* Reviews */}
                <div className="sk-section-block">
                  <h3>Reviews & Ratings</h3>
                  <div className="reviews-analysis-box" style={{backgroundColor: '#F9FAFB', borderRadius: '1rem', padding: '2rem', display: 'flex', gap: '4rem', alignItems: 'center', marginBottom: '2rem'}}>
                    <div className="raa-left" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem'}}>
                      <span className="raa-num" style={{fontSize: '3rem', fontWeight: 800, color: '#111827', lineHeight: 1}}>4.9</span>
                      <span className="raa-stars" style={{color: '#FBBF24', letterSpacing: '0.1em'}}>★★★★★</span>
                      <span className="raa-desc" style={{fontSize: '0.75rem', color: '#6B7280'}}>2 reviews</span>
                    </div>
                    <div className="raa-right" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      {[
                        {s:5, p:90},
                        {s:4, p:10},
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
                        <img src="https://placehold.co/40x40/333/fff?text=DM" alt="David M." style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                        <div className="rev-name-stack" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span className="rn-name" style={{fontWeight: 700, color: '#111827', fontSize: '0.875rem'}}>David Martinez</span>
                          <span className="rn-sub" style={{fontSize: '0.75rem', color: '#9CA3AF'}}>
                            <span style={{color: '#FBBF24'}}>★★★★★</span> 2 weeks ago
                          </span>
                        </div>
                      </div>
                      <div className="rev-verified-block" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                        <span className="rv-pill" style={{backgroundColor: '#ECFDF5', color: '#10B981', fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}><span className="green-dot" style={{width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block'}}></span> Verified Interaction</span>
                        <span className="rv-desc" style={{fontSize: '0.65rem', color: '#9CA3AF'}}>Completed session</span>
                      </div>
                    </div>
                    <p className="rev-msg" style={{fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: 0}}>
                      Sarah is an amazing tutor! She helped me debug a huge issue in my final project and explained exactly why my React state wasn't updating correctly.
                    </p>
                  </div>

                  <div className="review-card" style={{border: '1px solid #F3F4F6', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem'}}>
                    <div className="rev-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                      <div className="rev-user-grp" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img src="https://placehold.co/40x40/555/fff?text=EW" alt="Emma W." style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
                        <div className="rev-name-stack" style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                          <span className="rn-name" style={{fontWeight: 700, color: '#111827', fontSize: '0.875rem'}}>Emma Wilson</span>
                          <span className="rn-sub" style={{fontSize: '0.75rem', color: '#9CA3AF'}}>
                            <span style={{color: '#FBBF24'}}>★★★★★</span> 1 month ago
                          </span>
                        </div>
                      </div>
                      <div className="rev-verified-block" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                        <span className="rv-pill" style={{backgroundColor: '#ECFDF5', color: '#10B981', fontSize: '0.65rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '0.25rem'}}><span className="green-dot" style={{width: '6px', height: '6px', backgroundColor: '#10B981', borderRadius: '50%', display: 'inline-block'}}></span> Verified Interaction</span>
                        <span className="rv-desc" style={{fontSize: '0.65rem', color: '#9CA3AF'}}>Completed session</span>
                      </div>
                    </div>
                    <p className="rev-msg" style={{fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, margin: 0}}>
                      Best tutoring session I've had! Sarah was patient and explained concepts clearly. Highly recommend!
                    </p>
                  </div>

                </div>
              </div>

              {/* Right Column */}
              <div className="sk-content-right">
                
                <div className="sk-seller-card">
                  <img src={skill.profile_image ? `http://localhost:5000${skill.profile_image}` : `https://placehold.co/80x80/222/fff?text=${skill.first_name?.[0] || 'U'}${skill.last_name?.[0] || ''}`} alt={skill.first_name} className="sk-seller-avatar" style={{objectFit: 'cover'}} />
                  <h4 className="sk-seller-name">{skill.first_name} {skill.last_name}</h4>
                  <p className="sk-seller-role">Member since {new Date(skill.created_at).getFullYear()}</p>
                  
                  <button 
                    className="sk-btn-primary" 
                    onClick={handleOrderRequest}
                    disabled={skill.available_quantity === 0 || skill.status !== 'Active'}
                    style={{
                      opacity: (skill.available_quantity === 0 || skill.status !== 'Active') ? 0.5 : 1,
                      cursor: (skill.available_quantity === 0 || skill.status !== 'Active') ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Request Session
                  </button>
                  
                  <ul className="sk-bullets">
                    <li>Track your request in Orders/ Notifications.</li>
                  </ul>
                </div>

                <div className="sk-terms-card">
                  <div className="sk-terms-header">
                    <svg className="sk-terms-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                    Exchange Terms
                  </div>
                  <p className="sk-terms-text">
                    {skill.charge_type === 'Free' 
                      ? 'Free for peers willing to trade skills.' 
                      : `Standard rate of ₹${skill.hourly_rate || '0.00'}/hr applies.`}
                  </p>
                </div>

              </div>
            </div>

            {/* Similar Skills */}
            <div className="sk-similar-head">
              <h2 style={{fontSize: '1.25rem', fontWeight: 700, margin: 0}}>Similar Skills</h2>
              <span className="sk-view-all" onClick={() => navigate('/skills', { state: { user }})}>View all ›</span>
            </div>
            
            <div className="sk-similar-grid">
              {[
                { title: "Python for Data Science", cat: "Programming", rate: "4.8", bg: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&auto=format&fit=crop&q=60", author: "Mike Chen" },
                { title: "UI/UX Design Basics", cat: "Design", rate: "4.9", bg: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&auto=format&fit=crop&q=60", author: "Lisa Park" },
                { title: "Spanish Conversation", cat: "Languages", rate: "4.7", bg: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=60", author: "Diego M." }
              ].map((sim, i) => (
                <div key={i} className="sk-sim-card">
                  <img src={sim.bg} className="sk-sim-img" alt={sim.title} />
                  <div className="sk-sim-overlay">
                    <h4 className="sk-sim-title">{sim.title}</h4>
                    <div className="sk-sim-bottom">
                      <span className="sk-sim-author">by {sim.author}</span>
                      <span className="sk-sim-rate">★ {sim.rate}</span>
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

export default SkillDetails;
