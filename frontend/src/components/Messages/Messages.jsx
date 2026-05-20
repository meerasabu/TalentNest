import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import Sidebar from '../Common/Sidebar';
import '../Dashboard/Index.css';
import './Messages.css';
import Header from '../Common/Header';
import io from 'socket.io-client';

const Messages = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user') || 'null');
  const { orderId } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePrefix = user?.email ? user.email.split('@')[0].toUpperCase() : 'USER';
  
  const [partnerGroups, setPartnerGroups] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewOrderId, setReviewOrderId] = useState(null);

  // Session-based states
  const [activeChatId, setActiveChatId] = useState(null);
  const [unreadSessions, setUnreadSessions] = useState({});

  const activeGroup = partnerGroups.find(g => g.partner_id === activePartnerId);

  const sortedChats = useMemo(() => {
    return activeGroup ? [...activeGroup.chats].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : [];
  }, [activeGroup]);

  const effectiveChatId = useMemo(() => {
    if (sortedChats.length === 0) return null;
    const exists = sortedChats.some(c => c.chat_id === activeChatId);
    if (exists) return activeChatId;
    
    // Priority 1: accepted & active sessions
    const activeSession = sortedChats.find(c => c.order_status === 'Accepted' && c.chat_status !== 'Completed' && c.chat_status !== 'Cancelled');
    // Priority 2: pending sessions
    const pendingSession = sortedChats.find(c => c.order_status === 'Pending');
    // Priority 3: fallback to latest session
    const fallback = sortedChats[sortedChats.length - 1];
    
    return activeSession?.chat_id || pendingSession?.chat_id || fallback?.chat_id || null;
  }, [sortedChats, activeChatId]);

  const currentChat = useMemo(() => {
    return sortedChats.find(c => c.chat_id === effectiveChatId) || null;
  }, [sortedChats, effectiveChatId]);

  const canType = useMemo(() => {
    return currentChat && currentChat.chat_status === 'Active' && currentChat.order_status === 'Accepted';
  }, [currentChat]);

  const messagesEndRef = useRef(null);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get(`/chats/${user?.id}`);
      if (res.data.success) {
        const groups = {};
        res.data.chats.forEach(chat => {
          if(!groups[chat.partner_id]) {
            groups[chat.partner_id] = {
              partner_id: chat.partner_id,
              partner_name: chat.partner_name,
              partner_image: chat.partner_image,
              chats: []
            };
          }
          groups[chat.partner_id].chats.push(chat);
        });
        const groupArr = Object.values(groups);
        setPartnerGroups(groupArr);
        return { groupArr, rawChats: res.data.chats };
      }
      return { groupArr: [], rawChats: [] };
    } catch (err) {
      console.error('Error fetching chats:', err);
      return { groupArr: [], rawChats: [] };
    }
  }, [user]);

  useEffect(() => {
    const initChats = async () => {
      setLoading(true);
      const fetched = await fetchChats();
      const rawChats = fetched?.rawChats || [];

      if (orderId) {
        const existingChat = rawChats.find(c => c.order_id === orderId);
        if (existingChat) {
          setActivePartnerId(existingChat.partner_id);
        } else {
          // Create new chat
          const createRes = await api.post(`/chats`, {
            orderId,
            userId: user?.id
          });
          if (createRes.data.success) {
            const updated = await fetchChats();
            const newlyCreated = updated.rawChats.find(c => c.order_id === orderId);
            if (newlyCreated) setActivePartnerId(newlyCreated.partner_id);
          }
        }
      }
      setLoading(false);
    };
    initChats();
  }, [user, orderId, fetchChats]);

  const socketRef = useRef(null);
  const activePartnerIdRef = useRef(activePartnerId);
  const sortedChatsRef = useRef([]);
  const activeChatIdRef = useRef(effectiveChatId);

  // Keep refs in sync so that the socket event listener always has current active values
  useEffect(() => {
    activePartnerIdRef.current = activePartnerId;
  }, [activePartnerId]);

  useEffect(() => {
    sortedChatsRef.current = sortedChats;
  }, [sortedChats]);

  useEffect(() => {
    activeChatIdRef.current = effectiveChatId;
  }, [effectiveChatId]);

  const fetchMessages = useCallback(async (partnerId) => {
    try {
      const res = await api.get(`/chats/user/${user?.id}/partner/${partnerId}/messages`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user]);

  // Socket connection initialization
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:5000', {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('join_user', user?.id);
    });

    socket.on('new_message', (msg) => {
      // Append message if it belongs to one of the active partner's chats
      const isRelevant = sortedChatsRef.current.some(c => c.chat_id === msg.chat_id);

      if (isRelevant) {
        setMessages(prev => {
          if (prev.some(m => m.message_id === msg.message_id)) return prev;
          // Filter out the optimistic temp message
          const filtered = prev.filter(m => !(m.isTemp && m.sender_id === msg.sender_id && m.message_text === msg.message_text));
          return [...filtered, msg];
        });

        // Set unread if message is for a background session
        if (msg.chat_id !== activeChatIdRef.current && msg.sender_id !== user?.id) {
          setUnreadSessions(prev => ({ ...prev, [msg.chat_id]: true }));
        }
      }

      // Always fetch chats to keep the list updated in real-time
      fetchChats();
    });

    socket.on('chat_completed', () => {
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    socket.on('chat_cancelled', () => {
      fetchChats();
      const currentActivePartnerId = activePartnerIdRef.current;
      if (currentActivePartnerId) {
        fetchMessages(currentActivePartnerId);
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [user, fetchChats, fetchMessages]);

  const fetchMessagesRef = useRef(fetchMessages);
  useEffect(() => {
    fetchMessagesRef.current = fetchMessages;
  }, [fetchMessages]);

  // Fetch messages once on partner switch
  useEffect(() => {
    if (activePartnerId) {
      fetchMessagesRef.current(activePartnerId);
    }
  }, [activePartnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, effectiveChatId]);



  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim() || !effectiveChatId || !socketRef.current) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    // Add temporary message for optimistic UI
    const tempMsg = {
      message_id: `temp-${Date.now()}`,
      isTemp: true,
      chat_id: effectiveChatId,
      sender_id: user?.id,
      message_text: msgText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Emit send_message event via WebSocket
    socketRef.current.emit('send_message', {
      chatId: effectiveChatId,
      senderId: user?.id,
      text: msgText
    });
  }, [newMessage, effectiveChatId, user]);

  const markCompleted = async (chatId) => {
    if(!window.confirm("Are you sure you want to mark this order as completed?")) return;
    try {
      const res = await api.post(`/chats/${chatId}/complete`);
      if (res.data.success) {
        fetchChats();
      }
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("Failed to mark as completed.");
    }
  };

  const cancelOrder = async (orderId) => {
    if(!window.confirm("Are you sure you want to cancel this order? This will restore inventory and disable the chat.")) return;
    try {
      const res = await api.post(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        alert("Order cancelled successfully.");
        fetchChats();
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.message || "Failed to cancel order.");
    }
  };

  const submitReport = async () => {
    try {
      const res = await api.post(`/chats/report`, {
        reporterId: user?.id,
        reportedId: activePartnerId,
        reason: reportReason
      });
      if (res.data.success) {
        alert("Report submitted successfully.");
        setReportModalOpen(false);
        setReportReason('');
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report.");
    }
  };

  const submitReview = async () => {
    try {
      const res = await api.post(`/reviews`, {
        reviewerId: user?.id,
        reviewedId: activePartnerId,
        orderId: reviewOrderId,
        rating: reviewRating,
        reviewText: reviewText
      });
      if (res.data.success) {
        alert("Review submitted successfully!");
        setReviewModalOpen(false);
        setReviewText('');
        setReviewRating(5);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert(error.response?.data?.message || "Failed to submit review.");
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPartnerAvatar = (obj) => {
    const imgPath = obj.partner_image || obj.profile_image;
    if (imgPath && imgPath !== 'undefined' && imgPath !== 'null' && imgPath !== '/uploads/undefined') {
      return <img src={`http://localhost:5000${imgPath}`} alt="Profile" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} />;
    }
    const name = obj.partner_name || (obj.first_name ? `${obj.first_name} ${obj.last_name || ''}` : null) || 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      const firstInitial = parts[0] && parts[0][0] ? parts[0][0] : '';
      const secondInitial = parts[1] && parts[1][0] ? parts[1][0] : '';
      return (firstInitial + secondInitial).toUpperCase() || 'U';
    }
    return name[0] ? name[0].toUpperCase() : 'U';
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <Sidebar user={user} handlePrefix={handlePrefix} />

      <main className="dashboard-main">
        <Header user={user} showSearch={false} />

        <div className="chat-layout">
          <div className="chat-sidebar">
            <h2 className="chat-sidebar-title">Messages</h2>
            <div className="chat-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" width="16" height="16">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Search chats..." />
            </div>

            <div className="chat-list">
              {loading ? (
                <div className="chat-loading">Loading chats...</div>
              ) : partnerGroups.length === 0 ? (
                <div className="chat-empty">No active chats.</div>
              ) : (
                partnerGroups.map(group => (
                  <div 
                    key={group.partner_id} 
                    className={`chat-list-item ${activePartnerId === group.partner_id ? 'active' : ''}`}
                    onClick={() => setActivePartnerId(group.partner_id)}
                  >
                    <div className="chat-avatar">
                      {getPartnerAvatar(group)}
                      <span className="online-indicator"></span>
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-header">
                        <span className="chat-name">{group.partner_name}</span>
                      </div>
                      <div className="chat-item-preview">
                        {group.chats.filter(c => c.chat_status !== 'Completed' && c.chat_status !== 'Cancelled').length} Active Session(s)
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-main">
            {activeGroup ? (
              <>
                <div className="chat-header">
                  <div className="chat-header-user">
                    <div className="chat-avatar">
                      {getPartnerAvatar(activeGroup)}
                    </div>
                    <div className="chat-header-info">
                      <h3>{activeGroup.partner_name}</h3>
                      <span className="status-text"><span className="online-dot"></span> Online now</span>
                    </div>
                  </div>
                </div>

                {/* Horizontal session tabs */}
                {sortedChats.length > 0 && (
                  <div className="chat-session-tabs">
                    {sortedChats.map(c => (
                      <button
                        key={c.chat_id}
                        className={`session-tab-btn ${c.chat_id === effectiveChatId ? 'active' : ''}`}
                        onClick={() => {
                          setActiveChatId(c.chat_id);
                          setUnreadSessions(prev => ({ ...prev, [c.chat_id]: false }));
                        }}
                      >
                        <span className="session-tab-title">{c.item_title || 'Request'}</span>
                        {unreadSessions[c.chat_id] && <span className="session-unread-dot" />}
                        <span className={`session-tab-badge ${c.order_status ? c.order_status.toLowerCase() : 'active'}`}>
                          {c.order_status || 'Active'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Fixed session details/actions bar */}
                {currentChat && (
                  <div className="chat-session-info-bar">
                    <div className="session-info-meta">
                      <span className="session-info-type">{currentChat.item_type || 'Request'}</span>
                      <h4 className="session-info-title">{currentChat.item_title || 'Request'}</h4>
                      {currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed' ? (
                        <span className="session-badge completed">Completed</span>
                      ) : currentChat.chat_status === 'Cancelled' || currentChat.order_status === 'Cancelled' ? (
                        <span className="session-badge cancelled">Cancelled</span>
                      ) : currentChat.order_status === 'Pending' ? (
                        <span className="session-badge pending">Pending</span>
                      ) : (
                        <span className="session-badge active">Active</span>
                      )}
                    </div>
                    <div className="session-info-actions">
                      {/* Mark as Completed */}
                      {currentChat.chat_status === 'Active' && currentChat.order_status === 'Accepted' && (
                        <button 
                          className="session-header-action-btn complete-btn" 
                          onClick={() => markCompleted(currentChat.chat_id)}
                        >
                          Mark as Completed
                        </button>
                      )}
                      
                      {/* Cancel Request */}
                      {currentChat.chat_status === 'Active' && (currentChat.order_status === 'Accepted' || currentChat.order_status === 'Pending') && (
                        <button 
                          className="session-header-action-btn cancel-btn" 
                          onClick={() => cancelOrder(currentChat.order_id)}
                        >
                          Cancel Request
                        </button>
                      )}
                      
                      {/* Leave a Review */}
                      {(currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed') && (
                        <button 
                          className="session-header-action-btn review-btn" 
                          onClick={() => { setReviewOrderId(currentChat.order_id); setReviewModalOpen(true); }}
                        >
                          Leave a Review
                        </button>
                      )}
                      
                      {/* Report */}
                      <button 
                        className="session-header-action-btn report-btn" 
                        onClick={() => { setReportModalOpen(true); }}
                      >
                        Report
                      </button>
                    </div>
                  </div>
                )}

                <div className="chat-messages">
                  {/* Messages timeline for activeChatId */}
                  {effectiveChatId && (
                    <div className="chat-session-messages-list">
                      {messages
                        .filter(m => m.chat_id === effectiveChatId)
                        .map((msg, mIdx) => {
                          const isMe = msg.sender_id === user?.id;
                          const chatMsgs = messages.filter(m => m.chat_id === effectiveChatId);
                          const showTime = mIdx === chatMsgs.length - 1 || chatMsgs[mIdx + 1]?.sender_id !== msg.sender_id;
                          
                          return (
                            <div key={msg.message_id || mIdx} className={`message-row ${isMe ? 'me' : 'them'}`}>
                              {!isMe && (
                                <div className="msg-avatar-small">
                                  {getPartnerAvatar(activeGroup)}
                                </div>
                              )}
                              <div className="message-content">
                                <div className="message-bubble">
                                  {msg.message_text}
                                </div>
                                {showTime && <span className="message-time">{formatTime(msg.created_at)}</span>}
                              </div>
                            </div>
                          );
                        })
                      }
                      
                      {/* System Notices in Timeline */}
                      {currentChat && (currentChat.chat_status === 'Completed' || currentChat.order_status === 'Completed') && (
                        <div className="chat-system-notice completed">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          This request has been marked as completed.
                        </div>
                      )}
                      
                      {currentChat && (currentChat.chat_status === 'Cancelled' || currentChat.order_status === 'Cancelled') && (
                        <div className="chat-system-notice cancelled">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line></svg>
                          This request has been cancelled.
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {canType ? (
                  <form className="chat-input-area" onSubmit={handleSendMessage}>
                    <button type="button" className="icon-btn attachment-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type your message..." 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </form>
                ) : (
                  <div className="chat-input-disabled">
                    {currentChat?.order_status === 'Pending' ? (
                      <span>Chat will become active once the seller accepts your request.</span>
                    ) : currentChat?.chat_status === 'Cancelled' || currentChat?.order_status === 'Cancelled' ? (
                      <span>This order has been cancelled. Chat is disabled.</span>
                    ) : (
                      <span>This conversation is marked as completed. Chat is disabled.</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="chat-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                <h3>Your Messages</h3>
                <p>Select a chat from the sidebar to start messaging.</p>
              </div>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {reportModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Report Conversation</h3>
              <p>Please provide a reason for reporting this conversation.</p>
              <textarea 
                value={reportReason} 
                onChange={e => setReportReason(e.target.value)}
                placeholder="Reason..."
                rows="4"
              ></textarea>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setReportModalOpen(false)}>Cancel</button>
                <button className="btn-danger" onClick={submitReport} disabled={!reportReason.trim()}>Submit Report</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Leave a Review</h3>
              <p>Rate your experience with this order.</p>
              <div className="rating-selector">
                {[1,2,3,4,5].map(star => (
                  <svg 
                    key={star}
                    onClick={() => setReviewRating(star)}
                    width="32" height="32" viewBox="0 0 24 24" 
                    fill={star <= reviewRating ? "#F59E0B" : "none"} 
                    stroke={star <= reviewRating ? "#F59E0B" : "#D1D5DB"} 
                    strokeWidth="2"
                    style={{cursor:'pointer', margin: '0 4px'}}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                ))}
              </div>
              <textarea 
                value={reviewText} 
                onChange={e => setReviewText(e.target.value)}
                placeholder="Write your review..."
                rows="4"
              ></textarea>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={submitReview}>Submit Review</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
