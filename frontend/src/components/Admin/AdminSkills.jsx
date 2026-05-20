import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AdminSidebar from './AdminSidebar';
import './AdminSkills.css';

const AdminSkills = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));
  
  const [skills, setSkills] = useState([]);
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Route protection
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchSkills();
    }
  }, [user]);

  const fetchSkills = async () => {
    try {
      const res = await api.get('/admin/skills');
      if (res.data.success) {
        setSkills(res.data.skills);
        setFilteredSkills(res.data.skills);
      }
    } catch (err) {
      console.error('Error fetching admin skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (skillId, newStatus) => {
    try {
      const res = await api.put(`/admin/skills/${skillId}/status`, {
        status: newStatus
      });
      if (res.data.success) {
        const updated = skills.map(s => s.id === skillId ? { ...s, status: newStatus } : s);
        setSkills(updated);
        filterList(searchTerm, updated);
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error updating skill status:', err);
    }
  };

  const filterList = (term, list = skills) => {
    const filtered = list.filter(s => 
      s.title.toLowerCase().includes(term.toLowerCase()) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
      s.category.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredSkills(filtered);
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterList(term);
  };

  const toggleDropdown = (id) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-container">
      <AdminSidebar activePage="skills" />

      <main className="admin-main">
        <header className="admin-header-flex">
          <div className="admin-header-text">
            <h1>Skills</h1>
            <p>Moderate skill exchanges and tutoring listings</p>
          </div>
          
          <div className="admin-controls">
            <div className="admin-search-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text" 
                placeholder="Search skills..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <button className="admin-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Category
            </button>
            
            <button className="admin-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Status
            </button>
          </div>
        </header>

        <div className="admin-table-container">
          {loading ? (
            <div style={{padding: '2rem', textAlign: 'center'}}>Loading skills...</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKILL TITLE</th>
                  <th>PROVIDER</th>
                  <th>CATEGORY</th>
                  <th>SESSION TYPE</th>
                  <th>COMPENSATION</th>
                  <th>STATUS</th>
                  <th className="text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.length > 0 ? filteredSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <strong style={{color: '#111827'}}>{skill.title}</strong>
                    </td>
                    <td>{skill.first_name} {skill.last_name}</td>
                    <td>{skill.category}</td>
                    <td>{skill.skill_type || 'Online'}</td>
                    <td>
                      {skill.charge_type === 'Paid' ? `Paid (₹${skill.hourly_rate}/hr)` : 'Exchange'}
                    </td>
                    <td>
                      <span className={`status-badge ${skill.status?.toLowerCase() || 'pending'}`}>
                        {skill.status || 'Pending'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-dropdown-wrapper">
                        <button className="options-btn" onClick={() => toggleDropdown(skill.id)}>
                          Options
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {activeDropdown === skill.id && (
                          <div className="admin-dropdown-menu">
                            <button onClick={() => navigate(`/admin/skills/${skill.id}`, { state: { user } })}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                              View
                            </button>
                            <button className="text-green" onClick={() => handleUpdateStatus(skill.id, 'Active')}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                              Verify
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '2rem', color: '#6B7280'}}>No skills found</td>
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

export default AdminSkills;
