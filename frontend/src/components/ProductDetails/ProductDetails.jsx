import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../api/axiosConfig';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css'; 
import './ProductDetails.css';
import Header from '../Common/Header';

const ProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  const user = location.state?.user || JSON.parse(localStorage.getItem('user')) || { id: 5, firstName: 'Student', lastName: '', email: 'student@university.edu' };
  const handlePrefix = user.email ? user.email.split('@')[0].toUpperCase() : '';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.product);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && product.category) {
      const fetchSimilar = async () => {
        try {
          const res = await api.get(`/products/category/${product.category}`);
          if (res.data.success) {
            // Filter out current product and take top 4
            const filtered = res.data.products.filter(p => p.id.toString() !== id);
            setSimilarProducts(filtered.slice(0, 4));
          }
        } catch (err) {
          console.error("Error fetching similar products:", err);
        }
      };
      fetchSimilar();
    }
  }, [product, id]);

  const handleOrderRequest = async () => {
    try {
      const res = await api.post('/orders', {
        buyerId: user.id || 5,
        sellerId: product.user_id,
        itemType: 'product',
        itemId: product.id,
        quantity: quantity
      });
      if (res.data.success) {
        alert('Order request sent successfully!');
        navigate('/orders', { state: { user } });
      }
    } catch (err) {
      console.error('Error sending order request:', err);
      alert(err.response?.data?.message || 'Failed to send order request.');
    }
  };

  if (loading) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Loading product details...</div>;
  }

  if (!product) {
    return <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>Product not found.</div>;
  }

  const imageUrls = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls.map(url => `http://localhost:5000${url}`) 
    : ['https://placehold.co/600x500/e6e3df/a39589?text=No+Image'];

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      {/* Main Container */}
      <main className="dashboard-main product-details-main">
        {/* Top Header mapping index style natively avoiding misalignment */}
        <Header user={user} />

        <div className="content-scrollable product-details-scroll">
          <div className="prod-viewer-wrapper">
             
             <div className="back-nav-pd" onClick={() => navigate('/marketplace', { state: { user } })} title="Go Back">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
             </div>

             {/* Top Stage Grid */}
             <div className="details-stage-grid">
               
               {/* Left: Image Gallery */}
               <div className="details-gallery">
                 <div className="main-image-wrap">
                   <img src={imageUrls[activeImageIndex]} alt={product.title} className="main-image-obj" />
                                       <span className="heart-icon-overlay" onClick={() => navigate('/wishlist', { state: { user } })} style={{cursor: 'pointer'}}>
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                   </span>
                 </div>
                 {imageUrls.length > 1 && (
                   <div className="thumb-row">
                     {imageUrls.map((url, idx) => (
                       <div key={idx} className={`thumb-item ${activeImageIndex === idx ? 'active' : ''}`} onClick={() => setActiveImageIndex(idx)}>
                         <img src={url} alt={`Thumb ${idx}`} />
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               {/* Right: Info Config */}
               <div className="details-meta-area">
                 <div className="stage-badges">
                   <span className="drk-badge blue-pill" style={{textTransform: 'uppercase'}}>{product.category}</span>
                   <span className={`drk-badge ${product.available_quantity > 0 && product.status !== 'Sold' ? 'green-pill' : 'red-pill'}`}>
                     {product.available_quantity > 0 && product.status !== 'Sold' && <span className="green-dot"></span>} 
                     {product.status === 'Sold' ? 'SOLD' : (product.available_quantity > 0 ? 'AVAILABLE' : 'OUT OF STOCK')}
                   </span>
                 </div>

                 <h1 className="stage-title">{product.title}</h1>
                 <div className="stage-price-row">
                   <span className="current-price">₹{product.price}</span>
                 </div>

                 <p className="stage-desc">
                   {product.description}
                 </p>
                 


                 <div className="stage-action-row">
                   <button 
                      className="btn-order" 
                      onClick={handleOrderRequest} 
                      disabled={product.available_quantity === 0 || product.status === 'Sold'} 
                      style={{
                        opacity: (product.available_quantity === 0 || product.status === 'Sold') ? 0.5 : 1, 
                        cursor: (product.available_quantity === 0 || product.status === 'Sold') ? 'not-allowed' : 'pointer'
                      }}
                    >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg> 
                     Send Order Request
                   </button>
                 </div>

                 <ul className="stage-bullets">
                   <li>Condition: {product.condition}</li>
                   <li>Listed on: {new Date(product.created_at).toLocaleDateString()}</li>
                 </ul>

                 <div className="seller-box">
                   <div className="seller-profile-group">
                     <img src={`https://placehold.co/40x40/333/fff?text=${product.first_name?.[0] || 'U'}${product.last_name?.[0] || ''}`} alt={product.first_name} className="seller-avatar" />
                     <div className="seller-name-stack">
                       <span className="sn-title">{product.first_name} {product.last_name}</span>
                       <span className="sn-rates"><span className="star-icon">★</span> <strong className="ora-text">Seller</strong></span>
                     </div>
                   </div>
                   <span className="seller-chevron">›</span>
                 </div>

                 <div className="stage-traits-row">
                   <div className="trait-box">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                     <div className="trait-text">
                       <strong>Verified Student</strong>
                       <p>Campus ID checked</p>
                     </div>
                   </div>
                   <div className="trait-box pb-green">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                     <div className="trait-text">
                       <strong>Campus Meetup</strong>
                       <p>Library Cafe</p>
                     </div>
                   </div>
                 </div>

               </div>
             </div>

             {/* Middle Section: Reviews */}
             <div className="pd-section-wrapper">
               <h2 className="pd-section-title">Reviews & Ratings</h2>
               
               {/* Analysis Block */}
               <div className="reviews-analysis-box">
                 <div className="raa-left">
                   <div className="raa-num">4.5</div>
                   <div className="raa-stars">
                     <span className="star-full">★</span><span className="star-full">★</span><span className="star-full">★</span><span className="star-full">★</span><span className="star-half">★</span>
                   </div>
                   <div className="raa-desc">2 reviews</div>
                 </div>
                 
                 <div className="raa-right">
                   {[
                     {st: 5, pct: '60%', w: '60%'},
                     {st: 4, pct: '30%', w: '30%'},
                     {st: 3, pct: '10%', w: '10%'},
                     {st: 2, pct: '10%', w: '10%'},
                     {st: 1, pct: '10%', w: '10%'}
                   ].map(row => (
                      <div key={row.st} className="raa-row">
                        <span className="raa-rlab">{row.st} ★</span>
                        <div className="raa-track"><div className="raa-fill" style={{ width: row.w }}></div></div>
                        <span className="raa-rpct">{row.pct}</span>
                      </div>
                   ))}
                 </div>
               </div>

               {/* Singular Reviews mapping natively */}
               <div className="review-card">
                 <div className="rev-head">
                   <div className="rev-user-grp">
                     <img src="https://placehold.co/40x40/666/fff?text=SJ" alt="Sarah" className="rev-avatar" />
                     <div className="rev-name-stack">
                       <span className="rn-name">Sarah Johnson</span>
                       <span className="rn-sub"><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-icon">★</span> 2 days ago</span>
                     </div>
                   </div>
                   <div className="rev-verified-block">
                     <span className="rv-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Verified Interaction</span>
                     <span className="rv-desc">Completed order</span>
                   </div>
                 </div>
                 <p className="rev-msg">Great product! Exactly as described. Met on campus and the transaction was smooth.</p>
               </div>

               <div className="review-card">
                 <div className="rev-head">
                   <div className="rev-user-grp">
                     <img src="https://placehold.co/40x40/999/fff?text=DL" alt="David" className="rev-avatar" />
                     <div className="rev-name-stack">
                       <span className="rn-name">David Lee</span>
                       <span className="rn-sub"><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-icon">★</span><span className="star-empty">★</span> 1 week ago</span>
                     </div>
                   </div>
                   <div className="rev-verified-block">
                     <span className="rv-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Verified Interaction</span>
                     <span className="rv-desc">Completed order</span>
                   </div>
                 </div>
                 <p className="rev-msg">Good quality, minor wear but nothing significant. Would buy from this seller again.</p>
               </div>
             </div>

             {/* Bottom Section: Similar items dynamic */}
              <div className="pd-section-wrapper">
                <div className="pd-similar-head">
                  <h2 className="pd-section-title" style={{margin:0}}>Similar Products</h2>
                  <span className="pd-view-all" onClick={() => navigate('/marketplace', { state: { user } })} style={{cursor: 'pointer'}}>View all ›</span>
                </div>

                <div className="pd-similar-grid">
                   {similarProducts.length > 0 ? similarProducts.map(sim => (
                     <div key={sim.id} className="sim-card" onClick={() => navigate(`/product/${sim.id}`, { state: { user } })} style={{cursor: 'pointer'}}>
                       <div className="sim-img-wrap">
                         <img 
                           src={sim.image_urls && sim.image_urls.length > 0 ? `http://localhost:5000${sim.image_urls[0]}` : "https://placehold.co/300x200/e6e3df/a39589?text=No+Image"} 
                           alt={sim.title} 
                           className="sim-img" 
                         />
                         <span className="sim-price-tag">₹{sim.price}</span>
                       </div>
                       <h4 className="sim-title">{sim.title}</h4>
                       <p className="sim-cat">{sim.category}</p>
                     </div>
                   )) : (
                     <div className="no-similar-msg" style={{padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', gridColumn: '1/-1'}}>
                       No other products found in this category.
                     </div>
                   )}
                </div>
              </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
