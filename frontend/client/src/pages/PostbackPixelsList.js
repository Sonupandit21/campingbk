import React, { useState, useEffect } from 'react';
import './PostbackPixels.css';

const PostbackPixelsList = ({ onAdd, onEdit, onDelete }) => {
  const [postbacks, setPostbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    publisher: '',
    campaign: '',
    status: ''
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://smarttrackyfly.com';

  useEffect(() => {
    fetchPostbacks();
  }, []);

  const fetchPostbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/postbacks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPostbacks(data);
      }
    } catch (error) {
      console.error('Failed to fetch postbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/postbacks/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setPostbacks(postbacks.map(pb => pb.id === id ? { ...pb, status: newStatus } : pb));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this postback?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/postbacks/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setPostbacks(postbacks.filter(pb => pb.id !== id));
        }
      } catch (error) {
        console.error('Failed to delete postback:', error);
      }
    }
  };

  const filteredPostbacks = postbacks.filter(pb => {
    const matchPub = !filters.publisher || (pb.publisherName || '').toLowerCase().includes(filters.publisher.toLowerCase());
    const matchCamp = !filters.campaign || (pb.campaignName || '').toLowerCase().includes(filters.campaign.toLowerCase());
    const matchStatus = !filters.status || pb.status === filters.status;
    return matchPub && matchCamp && matchStatus;
  });

  return (
    <div className="postback-container">
      <div className="postback-header">
        <div>
          <h2>Postback & Pixels</h2>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage your tracking postbacks and pixels</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            style={{
              background: showFilters ? '#eff6ff' : 'white', 
              border: showFilters ? '1px solid #3b82f6' : '1px solid #e2e8f0', 
              color: showFilters ? '#3b82f6' : '#64748b', 
              padding:'0.5rem 1rem', 
              borderRadius:'4px', 
              cursor:'pointer', 
              display:'flex', 
              alignItems:'center', 
              gap:'5px',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            <span>⚡</span> Filter
          </button>
          <button className="btn-add" onClick={onAdd} style={{ padding: '0.5rem 1rem' }}>
            <span>+</span> Add Postback
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-bar" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Publisher</label>
            <input 
              type="text" 
              placeholder="Search Publisher" 
              className="filter-input"
              style={{ width: '100%', minWidth: 'auto' }}
              value={filters.publisher}
              onChange={(e) => setFilters({ ...filters, publisher: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Campaign</label>
            <input 
              type="text" 
              placeholder="Search Campaign" 
              className="filter-input"
              style={{ width: '100%', minWidth: 'auto' }}
              value={filters.campaign}
              onChange={(e) => setFilters({ ...filters, campaign: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Status</label>
            <select 
              className="filter-select"
              style={{ width: '100%', minWidth: 'auto' }}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

      <div className="postback-table-container">
        <table className="postback-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Publisher</th>
              <th>Campaign</th>
              <th>Type</th>
              <th>Event</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
            ) : filteredPostbacks.length > 0 ? (
              filteredPostbacks.map(pb => (
                <tr key={pb.id}>
                  <td>{pb.postbackId || pb.id}</td>
                  <td>{pb.publisherName}</td>
                  <td>{pb.campaignName}</td>
                  <td>{pb.type}</td>
                  <td>{pb.event}</td>
                  <td>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={pb.status === 'Active'} 
                        onChange={() => handleToggleStatus(pb.id, pb.status)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <button className="action-btn edit" onClick={() => onEdit(pb)}>
                      ✏️
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(pb.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No postbacks found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PostbackPixelsList;
