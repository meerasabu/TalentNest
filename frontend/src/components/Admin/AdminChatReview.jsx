import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminChatReview.css';

const AdminChatReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = React.useMemo(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('user'));
  }, [location.state?.user]);

  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchReviewData();
    }
  }, [id, user]);

  const fetchReviewData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports/${id}/messages`);
      if (res.data.success) {
        setReport(res.data.report);
        setMessages(res.data.messages);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="chat" />

      <main className="admin-main">
        <header className="admin-header-flex detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/chat')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="admin-header-text">
            <h1>Conversation Review</h1>
          </div>
        </header>

        <div className="privacy-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <p>Chats are visible only for moderation purposes after a report is submitted.</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading conversation...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div className="chat-review-grid">
            <div className="chat-log-card">
              <div className="chat-log-header">
                <h3>Chat Log: {report.reporter_first_name} & {report.reported_first_name}</h3>
                <span className="related-item">Related to: {report.itemTitle}</span>
              </div>
              
              <div className="chat-messages-container">
                {messages.length > 0 ? messages.map((msg) => {
                  const isReported = msg.message_text.includes(report.reason.split(' ')[0]); // Simple heuristic for demo
                  return (
                    <div key={msg.message_id} className={`chat-message-wrapper ${msg.sender_id === report.reporter_id ? 'reporter' : 'reported'} ${isReported ? 'flagged-message' : ''}`}>
                      <div className="message-meta">
                        {isReported && <span className="flagged-label">Reported Message • </span>}
                        {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="message-bubble">
                        {msg.message_text}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="no-messages">No messages found for this interaction.</div>
                )}
              </div>
            </div>

            <div className="report-actions-sidebar">
              <div className="detail-card">
                <h3>Report Details</h3>
                <div className="report-info-block">
                  <label>REASON</label>
                  <p className="reason-text">{report.reason}</p>
                </div>
                <div className="report-info-block">
                  <label>REPORTED BY</label>
                  <p>{report.reporter_first_name} {report.reporter_last_name}</p>
                </div>
                <div className="report-info-block">
                  <label>DATE</label>
                  <p>{new Date(report.created_at).toISOString().split('T')[0]}</p>
                </div>

                <div className="action-buttons-stack">
                  <button className="mod-btn resolve-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Resolve Report
                  </button>
                  <button className="mod-btn warn-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    Warn User ({report.reported_first_name})
                  </button>
                  <button className="mod-btn restrict-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    Restrict Chat Access
                  </button>
                  <button className="mod-btn suspend-btn">
                    Suspend User ({report.reported_first_name})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminChatReview;
