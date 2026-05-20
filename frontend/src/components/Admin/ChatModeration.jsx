import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './ChatModeration.css';

const ChatModeration = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = React.useMemo(() => {
    return location.state?.user || JSON.parse(localStorage.getItem('user'));
  }, [location.state?.user]);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReports(res.data.reports);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reported conversations');
    } finally {
      setLoading(false);
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-wrapper')) {
        document.querySelectorAll('.action-dropdown.show').forEach(el => {
          el.classList.remove('show');
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="chat" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Reported Conversations</h1>
            <p>Review flagged interactions between students</p>
          </div>
        </header>

        <div className="privacy-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <p><strong>Privacy Note:</strong> Chats are visible only for moderation purposes after a report is submitted. Admin cannot monitor all chats by default.</p>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="loading-state">Loading reports...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>BUYER</th>
                  <th>SELLER</th>
                  <th>RELATED ITEM</th>
                  <th>REPORT REASON</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? reports.map((report) => (
                  <tr key={report.id}>
                    <td><strong>{report.reporter_first_name} {report.reporter_last_name}</strong></td>
                    <td style={{color: '#6B7280'}}>{report.reported_first_name} {report.reported_last_name}</td>
                    <td>{report.itemTitle}</td>
                    <td className="reason-cell">{report.reason}</td>
                    <td style={{color: '#6B7280'}}>{new Date(report.created_at).toISOString().split('T')[0]}</td>
                    <td>
                      <span className={`status-pill status-${report.status.toLowerCase().replace(' ', '-')}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-dropdown-wrapper">
                        <button className="options-btn" onClick={(e) => {
                          const dropdown = e.currentTarget.nextElementSibling;
                          dropdown.classList.toggle('show');
                        }}>
                          Options
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        <div className="action-dropdown">
                          <button onClick={() => navigate(`/admin/chat/${report.id}`)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            View Conversation
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No reports found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatModeration;
