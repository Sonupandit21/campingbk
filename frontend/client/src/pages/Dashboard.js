import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

import CreateCampaign from './CreateCampaign';
import AddPublisher from './AddPublisher';
import ManagePublishers from './ManagePublishers';
import ChangePassword from './ChangePassword';
import EditProfile from './EditProfile';
import GlobalPostback from './GlobalPostback';
import ManageCampaigns from './ManageCampaigns';
import Reports from './Reports';



const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const Dashboard = () => {
  const { user, logout, impersonateLogin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [usersList, setUsersList] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [editingPublisher, setEditingPublisher] = useState(null);
  const [offerCount, setOfferCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [topPerformers, setTopPerformers] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [topSales, setTopSales] = useState({ name: 'No Data', count: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Stats
        const statsRes = await fetch(`${BACKEND_URL}/api/stats`, { headers });
        if (statsRes.ok) {
            const stats = await statsRes.json();
            setOfferCount(stats.offers);
            setResponseCount(stats.responses);
            setUserCount(stats.users);
            setTopPerformers(stats.topPerformers || []);
            setWeeklyStats(stats.weeklyStats || [0, 0, 0, 0, 0, 0, 0]);
            setTopSales(stats.topSales || { name: 'No Data', count: 0 });
        } else {
             // Fallback
             const userRes = await fetch(`${BACKEND_URL}/api/auth/users`, { headers });
             if (userRes.ok) {
               const users = await userRes.json();
               setUserCount(users.length);
             }
        }
        
        const userRes = await fetch(`${BACKEND_URL}/api/auth/users`, { headers });
        if (userRes.ok) {
            const users = await userRes.json();
            setUsersList(users);
        }

        // Fetch Publishers
        const pubRes = await fetch(`${BACKEND_URL}/api/publishers`, { headers });
        if (pubRes.ok) {
          const pubs = await pubRes.json();
          setPublishers(pubs);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
        setIsMobileOpen(!isMobileOpen);
    } else {
        setIsSidebarOpen(!isSidebarOpen);
    }
  };

  // Close mobile sidebar on tab change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/auth/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
           // Update local state
           setUsersList(usersList.filter(u => u.id !== userId));
           setUserCount(userCount - 1);
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleEditPublisher = (publisher) => {
    setEditingPublisher(publisher);
    setActiveTab('AddPublisher');
  };

  const handleSavePublisher = async (publisherData) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
      };

      if (editingPublisher) {
        // Update existing
        const response = await fetch(`${BACKEND_URL}/api/publishers/${editingPublisher.id}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(publisherData)
        });
        if (response.ok) {
           const updatedPub = await response.json();
           setPublishers(publishers.map(p => p.id === editingPublisher.id ? updatedPub : p));
        } else {
            const errorData = await response.json();
            alert(`Failed to update publisher: ${errorData.error || 'Unknown error'}`);
            return; // Don't close form
        }
        setEditingPublisher(null);
      } else {
        // Add new
        const response = await fetch(`${BACKEND_URL}/api/publishers`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(publisherData)
        });
        if (response.ok) {
           const newPub = await response.json();
           setPublishers([...publishers, newPub]);
        } else {
            const errorData = await response.json();
            alert(`Failed to create publisher: ${errorData.error || 'Unknown error'}`);
            return; // Don't close form
        }
      }
      setActiveTab('ManagePublishers');
    } catch (error) {
      console.error('Failed to save publisher:', error);
      alert('Failed to save publisher: Network error');
    }
  };

  const handleDeletePublisher = async (publisherId) => {
    if (window.confirm('Are you sure you want to delete this publisher?')) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/publishers/${publisherId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setPublishers(publishers.filter(p => p.id !== publisherId));
            }
        } catch (error) {
            console.error('Failed to delete publisher:', error);
            alert('Failed to delete publisher');
        }
    }
  };



  // ... (existing code)

  const handleLoginAs = async (publisher) => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/auth/admin/impersonate-publisher`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ publisherId: publisher.id }) 
        });
        
        if (response.ok) {
            const data = await response.json();
            // Perform context login (swap token)
            impersonateLogin(data.token, data.publisher); 
            navigate('/publisher/dashboard');
        } else {
            const err = await response.json();
            alert(`Impersonation failed: ${err.error}`);
        }
    } catch (e) {
        console.error(e);
        alert(`Impersonation failed: ${e.message}`);
    }
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-icon">{user?.role === 'superadmin' ? '🛡️' : '✦'}</div>
          <span className="logo-text">{user?.role === 'superadmin' ? 'Super Admin' : 'Campaign Admin'}</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">HOME</div>
          <a href="#" className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <span className="icon">⊞</span> <span className="label">Dashboard</span>
          </a>

          <div className="nav-section">CAMPAIGNS</div>
          <a href="#" className={`nav-item ${activeTab === 'CreateCampaign' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('CreateCampaign'); }}><span className="icon">+</span> <span className="label">Create</span></a>
          <a href="#" className={`nav-item ${activeTab === 'ManageCampaigns' ? 'active' : ''}`} onClick={() => setActiveTab('ManageCampaigns')}><span className="icon">❖</span> <span className="label">Manage</span></a>
          {/* <a href="#" className="nav-item"><span className="icon">🔗</span> <span className="label">Events</span></a> */}

          <div className="nav-section">PUBLISHERS</div>
          <a href="#" className={`nav-item ${activeTab === 'ManagePublishers' || activeTab === 'AddPublisher' ? 'active' : ''}`} onClick={() => { setActiveTab('ManagePublishers'); setEditingPublisher(null); }}>
            <span className="icon">👥</span> <span className="label">Manage</span>        
          </a>

          <div className="nav-section">REPORTS</div>
          <a href="#" className={`nav-item ${activeTab === 'Reports' ? 'active' : ''}`} onClick={() => setActiveTab('Reports')}><span className="icon">📄</span> <span className="label">Reports</span></a>
          {/* <a href="#" className="nav-item"><span className="icon">📥</span> <span className="label">Bulk Update</span></a> */}

          <div className="nav-section">USER MANAGEMENT</div>
          <a href="#" className={`nav-item ${activeTab === 'Users' ? 'active' : ''}`} onClick={() => setActiveTab('Users')}>
            <span className="icon">👤</span> <span className="label">Users</span>
          </a>

          <div className="nav-section">SETTINGS</div>
          <a href="#" className={`nav-item ${activeTab === 'GlobalPostback' ? 'active' : ''}`} onClick={() => setActiveTab('GlobalPostback')}><span className="icon">⚙</span> <span className="label">Global Postback</span></a>
          <a href="#" className={`nav-item ${activeTab === 'ChangePassword' ? 'active' : ''}`} onClick={() => setActiveTab('ChangePassword')}><span className="icon">🔒</span> <span className="label">Change Password</span></a>
        </nav>

        {/* Sidebar Footer Removed */}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <button className="menu-btn" onClick={toggleSidebar}>☰</button>
          <div className="user-profile-container">
            <div className="user-profile" onClick={toggleProfile}>
               <img src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=random`} alt="Profile" className="avatar"/>
            </div>
            
            {/* Profile Modal */}
            {showProfile && (
              <div className="profile-modal">
                <div className="profile-modal-content">
                  <h3>User Profile</h3>
                  <div className="profile-info">
                    <img src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&size=80`} alt="Avatar" className="profile-avatar"/>
                    <h4>{user?.name || 'User'}</h4>
                    <p className="profile-role">
                      {user?.role === 'superadmin' ? 'Super Admin' : (user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'User')}
                    </p>
                    <p className="profile-email">
                      <span>✉</span> {user?.email || ''}
                    </p>
                  </div>
                  <div style={{marginBottom: '1rem', textAlign: 'center'}}>
                    <a href="#" style={{color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem'}} onClick={(e) => { e.preventDefault(); setActiveTab('EditProfile'); toggleProfile(); }}>Edit Profile</a>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-wrapper">
          {activeTab === 'Dashboard' && (
            <>
              {/* Stats Cards Row */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon purple">🔗</div>
                  <div className="stat-info">
                    <h4>Offers</h4>
                    <h2>{offerCount}</h2>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blue">📬</div>
                  <div className="stat-info">
                    <h4>Responses</h4>
                    <h2>{responseCount}</h2>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon indigo">👤</div>
                  <div className="stat-info">
                    <h4>Users</h4>
                    <h2>{userCount}</h2>
                  </div>
                </div>
                {/* <div className="stat-card">
                  <div className="stat-icon cyan">🔗</div>
                  <div className="stat-info">
                    <h4>Offers</h4>
                    <h2>0</h2>
                  </div>
                </div>
                 <div className="stat-card">
                  <div className="stat-icon blue">📬</div>
                  <div className="stat-info">
                    <h4>Responses</h4>
                    <h2>0</h2>
                  </div>
                </div>
                 <div className="stat-card">
                  <div className="stat-icon indigo">👤</div>
                  <div className="stat-info">
                    <h4>Users</h4>
                    <h2>{userCount}</h2>
                  </div>
                </div> */}
              </div>

              {/* Middle Section: Chart & Table */}
              <div className="dashboard-grid">
                {/* Weekly Stats (Chart Placeholder) */}
                <div className="card chart-card">
                  <div className="card-header">
                    <h3>Weekly Stats</h3>
                    <span className="subtitle">Average sales</span>
                  </div>
                  <div className="chart-placeholder">
                    {/* Dynamic Wave Chart using SVG based on weeklyStats */}
                    <svg viewBox="0 0 500 150" className="wave-chart">
                      <path 
                        d={`M0,150 L0,${150 - (weeklyStats[0] * 10)} 
                           Q125,${150 - (weeklyStats[1] * 20)} 250,${150 - (weeklyStats[3] * 15)} 
                           T500,${150 - (weeklyStats[6] * 10)} L500,150 Z`} 
                        fill="url(#gradient)" 
                        opacity="0.2" 
                      />
                      <path 
                        d={`M0,${150 - (weeklyStats[0] * 10)} 
                           Q125,${150 - (weeklyStats[1] * 20)} 250,${150 - (weeklyStats[3] * 15)} 
                           T500,${150 - (weeklyStats[6] * 10)}`} 
                        fill="none" 
                        stroke="#6366f1" 
                        strokeWidth="3" 
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="list-items">
                    <div className="list-item">
                      <div className="item-icon">:::</div>
                      <div className="item-details">
                        <h4>Top Sales</h4>
                        <p>{topSales.name}</p>
                      </div>
                      <span className="badge">+{topSales.count}</span>
                    </div>
                    {/* ... other items ... */}
                  </div>
                </div>

                {/* Top Performers Table */}
                <div className="card table-card">
                  <div className="card-header">
                    <h3>Top Performers</h3>
                    <span className="subtitle">Best Offers</span>
                  </div>
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Offer Name</th>
                          <th>Created by</th>
                          <th>Responses</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPerformers.length > 0 ? (
                          topPerformers.map((performer, index) => (
                            <tr key={index}>
                              <td>
                                <div style={{ fontWeight: 600, color: '#334155' }}>
                                  {performer.offerName}
                                </div>
                              </td>
                              <td>{performer.createdBy}</td>
                              <td>{performer.responses}</td>
                              <td></td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center" style={{padding: '3rem', color: '#94a3b8'}}>
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'CreateCampaign' && (
             <CreateCampaign onCancel={() => setActiveTab('Dashboard')} />
          )}

          {activeTab === 'ManagePublishers' && (
             <ManagePublishers 
               publishers={publishers}
               onAddPublisher={() => { setEditingPublisher(null); setActiveTab('AddPublisher'); }} 
               onEditPublisher={handleEditPublisher}
               onDeletePublisher={handleDeletePublisher}
               onLoginAs={handleLoginAs}
             />
          )}

          {activeTab === 'AddPublisher' && (
             <AddPublisher 
               initialData={editingPublisher}
               onCancel={() => { setEditingPublisher(null); setActiveTab('ManagePublishers'); }} 
               onSave={handleSavePublisher} 
             />
          )}

          {activeTab === 'Users' && (
            <div className="card users-card">
              <div className="card-header">
                <h3>User Management</h3>
                <span className="subtitle">Manage all registered users</span>
              </div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <img 
                              src={u.photo || `https://ui-avatars.com/api/?name=${u.name || 'User'}&background=random`} 
                              alt="Avatar" 
                              style={{width: '32px', height: '32px', borderRadius: '50%'}}
                            />
                            <span style={{fontWeight: 600, color: '#334155'}}>{u.name || u.username}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.mobile || '-'}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'orange' : (u.role === 'superadmin' ? 'red' : 'green')}`}>
                            {u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'User'}
                          </span>
                        </td>
                        <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            style={{
                              border: 'none', 
                              background: '#fee2e2', 
                              color: '#ef4444', 
                              padding: '5px 10px', 
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                         <td colSpan="6" className="text-center" style={{padding: '2rem'}}>No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'ManageCampaigns' && (
             <ManageCampaigns />
          )}

          {activeTab === 'ChangePassword' && (
             <ChangePassword />
          )}

          {activeTab === 'EditProfile' && (
             <EditProfile />
          )}

          {activeTab === 'GlobalPostback' && (
             <GlobalPostback />
          )}

          {activeTab === 'Reports' && (
             <Reports />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
