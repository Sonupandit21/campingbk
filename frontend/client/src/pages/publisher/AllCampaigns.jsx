import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Globe, 
  LogOut, 
  Menu, 
  Bell, 
  ChevronDown, 
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Plus
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import '../PublisherDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://smart.trackyfly.com';

const AllCampaigns = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/campaigns/publisher/all-campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestApproval = async (campaignId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaignId}/request-approval`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        // Refresh campaigns to show pending status
        fetchCampaigns();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to request approval');
      }
    } catch (error) {
      console.error('Error requesting approval:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const handleLogout = () => {
    logout();
    navigate('/publisher/login');
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id?.toString().includes(searchTerm)
  );

  const getStatusBadge = (status, isAssigned) => {
    if (isAssigned || status === 'approved') {
      return (
        <span 
          className="badge-premium" 
          style={{ 
            background: '#dcfce7', 
            color: '#166534', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          <CheckCircle size={14} /> Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span 
          className="badge-premium" 
          style={{ 
            background: '#f3e8ff', 
            color: '#7e22ce', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          <Clock size={14} /> Pending
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span 
          className="badge-premium" 
          style={{ 
            background: '#fee2e2', 
            color: '#991b1b', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}
        >
          <XCircle size={14} /> Rejected
        </span>
      );
    }
    return (
      <span 
        className="badge-premium" 
        style={{ 
          background: '#f1f5f9', 
          color: '#475569', 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}
      >
        Not Requested
      </span>
    );
  };

  const getTrackingLink = (campaign) => {
    return `https://smart.trackyfly.com/track?camp_id=${campaign.id}&publisher_id=${user.id}`;
  };

  return (
    <div className="pub-dashboard">
      {/* Sidebar - Same as PublisherDashboard */}
      <aside className={`pub-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="pub-sidebar-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="Logo" />
          </div>
          <span className="logo-text">Smart Trackyfly</span>
        </div>
        
        <nav className="pub-nav">
          <div className="nav-section-title">{isSidebarOpen ? 'Main Menu' : '•••'}</div>
          <button className="pub-nav-item" onClick={() => navigate('/publisher/dashboard')}>
            <LayoutDashboard size={22} className="icon" />
            {isSidebarOpen && <span className="label">Dashboard</span>}
          </button>

          <button className="pub-nav-item active">
            <Plus size={22} className="icon" />
            {isSidebarOpen && <span className="label">Manage</span>}
          </button>
          
          <button className="pub-nav-item" onClick={() => navigate('/publisher/dashboard', { state: { tab: 'Reports' } })}>
            <BarChart3 size={22} className="icon" />
            {isSidebarOpen && <span className="label">Reports</span>}
          </button>
          
          <div className="nav-section-title" style={{ marginTop: '12px' }}>{isSidebarOpen ? 'Personal' : '•••'}</div>
          <button className="pub-nav-item" onClick={() => navigate('/publisher/dashboard', { state: { tab: 'Profile' } })}>
            <Users size={22} className="icon" />
            {isSidebarOpen && <span className="label">My Profile</span>}
          </button>
          <button className="pub-nav-item" onClick={() => navigate('/publisher/dashboard', { state: { tab: 'Global Postback' } })}>
            <Globe size={22} className="icon" />
            {isSidebarOpen && <span className="label">Postbacks</span>}
          </button>
          
          <button className="pub-nav-item danger" onClick={handleLogout} style={{ marginTop: 'auto', marginBottom: '20px' }}>
            <LogOut size={22} className="icon" />
            {isSidebarOpen && <span className="label">Logout</span>}
          </button>
        </nav>
      </aside>

      <main className="pub-main">
        <header className="pub-header">
           <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
           </button>
           <div className="header-right">
              <div className="user-pill" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                  <div className="user-avatar-small">{user?.fullName?.charAt(0) || 'P'}</div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', display: isSidebarOpen ? 'block' : 'none' }}>
                    {user?.fullName}
                  </span>
                  <ChevronDown size={16} color="var(--text-muted)" />
              </div>
           </div>
        </header>

        <div className="pub-content">
          <div style={{ marginBottom: '24px' }}>
            <h1 className="pub-page-title">Manage Campaigns</h1>
            <p className="pub-page-subtitle">Browse and request access to campaigns.</p>
          </div>

          <div className="pub-table-card">
            <div className="pub-table-header">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search campaigns..." 
                  className="pub-input"
                  style={{ paddingLeft: '40px', width: '300px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="pub-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Payout</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px' }}>Loading Campaigns...</td></tr>
                  ) : filteredCampaigns.length > 0 ? (
                    filteredCampaigns.map((camp) => (
                      <tr key={camp.id} className="pub-table-row">
                        <td>{camp.id}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{camp.title}</div>
                        </td>
                        <td>{getStatusBadge(camp.approvalStatus, camp.isAssigned)}</td>
                        <td style={{ fontWeight: '700', color: '#4f46e5' }}>₹{camp.payouts?.[0]?.payoutValue || '0'}</td>
                        <td>
                          {camp.isAssigned || camp.approvalStatus === 'approved' ? (
                            <button 
                              className="pub-nav-item active" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                              onClick={() => copyToClipboard(getTrackingLink(camp))}
                            >
                              <Copy size={14} style={{ marginRight: '6px' }} /> Get Link
                            </button>
                          ) : camp.approvalStatus === 'pending' ? (
                            <button className="pub-nav-item" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.6 }} disabled>
                              Pending...
                            </button>
                          ) : camp.approvalStatus === 'rejected' ? (
                            <button className="pub-nav-item danger" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.6 }} disabled>
                              Rejected
                            </button>
                          ) : (
                            <button 
                              className="pub-nav-item active" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                              onClick={() => requestApproval(camp._id || camp.id)}
                            >
                              Request Approval
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No campaigns found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AllCampaigns;
