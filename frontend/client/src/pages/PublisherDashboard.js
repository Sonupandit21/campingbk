import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css'; // Reuse dashboard styles

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const PublisherDashboard = () => {
  const navigate = useNavigate();
  // const location = useLocation(); // No longer needed for publisher data
  const { user, logout } = useAuth();
  
  // Verify if user is publisher
  useEffect(() => {
      if (!user) {
          navigate('/publisher/login'); // Should be handled by ProtectedRoute but extra safety
          return;
      }
      if (user.role !== 'publisher') {
          // If admin tries to access without impersonating, redirect or show error?
          // For now, redirect to main login or dashboard
          navigate('/dashboard'); 
      }
  }, [user, navigate]);

  const publisher = user || { fullName: 'Publisher', id: 0 };
  const [activeTab, setActiveTab] = useState('Manage');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Data State
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedIp, setDetectedIp] = useState('');
  
  const [stats, setStats] = useState({
      clicks: 0,
      conversions: 0,
      payout: 0
  });

  // Reporting States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showColumnOptions, setShowColumnOptions] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    campaignName: true,
    goalName: true,
    source: true,
    unique_clicks: true,
    clicks: true,
    conversions: true,
    cr: true,
    epc: true,
    payout: true
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/publisher/login');
  };

    useEffect(() => {
        const fetchDetectedIp = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/utils/my-ip`);
                if (response.ok) {
                    const data = await response.json();
                    setDetectedIp(data.ip);
                }
            } catch (err) {
                console.error('Error fetching IP:', err);
            }
        };
        fetchDetectedIp();
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!publisher.id) return;
            
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                // Fetch report specifically for this publisher
                // We don't filter by campaign here (unless we want to), so we get all campaigns for this publisher
                // We default to "today" or "all time"? Let's do "All Time" (no date filter) or maybe "This Month"?
                // For now, let's fetch ALL data to ensure we see something.
                const query = `?publisherId=${publisher.id}`; 
                
                const response = await fetch(`${BACKEND_URL}/api/reports${query}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setReportData(data);
                    
                    // Calculate totals
                    const totalClicks = data.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
                    const totalConversions = data.reduce((acc, curr) => acc + (curr.conversions || 0), 0);
                    const totalPayout = data.reduce((acc, curr) => acc + (curr.payout || 0), 0);
                    
                    setStats({ 
                        clicks: totalClicks,
                        conversions: totalConversions,
                        payout: totalPayout
                    });
                } else {
                    console.error('Failed to fetch publisher report');
                    setError('Failed to load data');
                }
            } catch (err) {
                console.error('Error fetching publisher report:', err);
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'Manage' || activeTab === 'Dashboard') {
            fetchReportData();
        }
    }, [activeTab, publisher.id]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    // Processed Data (Aggregation, Filter, Sort)
    const processedData = React.useMemo(() => {
        let data = [...reportData];

        // 1. Aggregation (Merge rows if Date or Source hidden)
        if (!visibleColumns.date || !visibleColumns.source) {
            const aggMap = new Map();
            data.forEach(row => {
                const dateKey = visibleColumns.date ? (row.date || '') : 'ALL';
                const sourceKey = visibleColumns.source ? (row.source || '') : 'ALL';
                const campKey = row.campaignName || ''; // Always group by campaign in pub dash for now
                const key = `${dateKey}|${sourceKey}|${campKey}`;

                if (!aggMap.has(key)) {
                    aggMap.set(key, {
                        ...row,
                        date: visibleColumns.date ? row.date : 'All Dates',
                        source: visibleColumns.source ? row.source : '',
                        clicks: 0,
                        unique_clicks: 0,
                        conversions: 0,
                        payout: 0
                    });
                }
                const entry = aggMap.get(key);
                entry.clicks += (row.clicks || 0);
                entry.unique_clicks += (row.unique_clicks || 0);
                entry.conversions += (row.conversions || 0);
                entry.payout += (row.payout || 0);
            });
            data = Array.from(aggMap.values()).map(row => ({
                ...row,
                cr: row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : 0,
                epc: row.clicks > 0 ? (row.payout / row.clicks).toFixed(4) : 0
            }));
        }

        // 2. Search
        if (searchTerm) {
            const st = searchTerm.toLowerCase();
            data = data.filter(row => 
                Object.values(row).some(v => String(v).toLowerCase().includes(st))
            );
        }

        // 3. Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                let av = a[sortConfig.key];
                let bv = b[sortConfig.key];
                if (['clicks', 'unique_clicks', 'conversions', 'cr', 'epc', 'payout'].includes(sortConfig.key)) {
                    av = parseFloat(av) || 0;
                    bv = parseFloat(bv) || 0;
                }
                if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
                if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [reportData, visibleColumns, searchTerm, sortConfig]);


  return (
    <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Trackier Logo" style={{ width: '40px', height: 'auto' }} />
          <span className="logo-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Trackier Panel</span>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">MAIN</div>
          <a href="#" className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
            <span className="icon">⊞</span> <span className="label">Dashboard</span>
          </a>

          <div className="nav-section">ANALYTICS</div>
          <a href="#" className={`nav-item ${activeTab === 'Manage' ? 'active' : ''}`} onClick={() => setActiveTab('Manage')}>
            <span className="icon">📊</span> <span className="label">Manage</span>
          </a>
        </nav>


      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <button className="menu-btn" onClick={toggleSidebar}>☰</button>
          
          <div className="top-right-actions" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
             {/* Notification Icon */}
             <button className="icon-btn" style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
             </button>
             
             {/* Search Icon */}
             <button className="icon-btn" style={{background:'none', border:'none', cursor:'pointer', color:'#64748b'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
             </button>

             {/* User Profile */}
             <div className="user-profile-container" style={{position: 'relative'}}>
                <div 
                    className="avatar-circle" 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    style={{
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: '#cbd5e1', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                   </svg>
                </div>

                {showProfileMenu && (
                   <div className="profile-dropdown" style={{
                       position: 'absolute',
                       top: '120%',
                       right: 0,
                       background: 'white',
                       borderRadius: '8px',
                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                       width: '200px',
                       zIndex: 50,
                       overflow: 'hidden'
                   }}>
                      <div onClick={() => { setActiveTab('Profile'); setShowProfileMenu(false); }} style={{padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.9rem', color:'#334155'}}>Profile</div>
                      <div onClick={() => { setActiveTab('Global Postback'); setShowProfileMenu(false); }} style={{padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.9rem', color:'#334155'}}>Global Postback</div>
                      {detectedIp && (
                          <div style={{padding: '8px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '0.75rem', color:'#94a3b8', background: '#f8fafc'}}>
                              IP: {detectedIp}
                          </div>
                      )}
                      <div onClick={handleLogout} style={{padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem', color:'#ef4444'}}>Logout</div>
                   </div>
                )}
             </div>
          </div>
        </header>

        <div className="content-wrapper">
          {activeTab === 'Manage' && (
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h3>Report</h3>
                        <span className="subtitle">Performance metrics for your campaigns</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input 
                            type="text" 
                            placeholder="Search..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
                        />
                        
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowColumnOptions(!showColumnOptions)}
                                style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                Columns ▾
                            </button>
                            {showColumnOptions && (
                                <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: '180px', marginTop: '5px' }}>
                                    {Object.keys(visibleColumns).map(col => (
                                        <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', marginBottom: '6px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} />
                                            {col.charAt(0).toUpperCase() + col.slice(1).replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                {visibleColumns.date && <th onClick={() => handleSort('date')} style={{cursor:'pointer'}}>Date {sortConfig.key==='date'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.campaignName && <th onClick={() => handleSort('campaignName')} style={{cursor:'pointer'}}>Campaign {sortConfig.key==='campaignName'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.goalName && <th onClick={() => handleSort('goalName')} style={{cursor:'pointer'}}>Goal Name {sortConfig.key==='goalName'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.source && <th onClick={() => handleSort('source')} style={{cursor:'pointer'}}>Source {sortConfig.key==='source'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.unique_clicks && <th onClick={() => handleSort('unique_clicks')} style={{cursor:'pointer'}}>Unique {sortConfig.key==='unique_clicks'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.clicks && <th onClick={() => handleSort('clicks')} style={{cursor:'pointer'}}>Clicks {sortConfig.key==='clicks'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.conversions && <th onClick={() => handleSort('conversions')} style={{cursor:'pointer'}}>Approved {sortConfig.key==='conversions'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.cr && <th onClick={() => handleSort('cr')} style={{cursor:'pointer'}}>CR% {sortConfig.key==='cr'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.epc && <th onClick={() => handleSort('epc')} style={{cursor:'pointer'}}>EPC {sortConfig.key==='epc'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                                {visibleColumns.payout && <th onClick={() => handleSort('payout')} style={{cursor:'pointer'}}>Revenue {sortConfig.key==='payout'&&(sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="10" className="text-center">Loading...</td></tr>
                            ) : processedData.length > 0 ? (
                                processedData.map((row, index) => (
                                    <tr key={index}>
                                        {visibleColumns.date && <td>{row.date}</td>}
                                        {visibleColumns.campaignName && <td>{row.campaignName}</td>}
                                        {visibleColumns.goalName && <td>{row.goalName || 'N/A'}</td>}
                                        {visibleColumns.source && <td style={{wordBreak:'break-all'}}>{row.source || '-'}</td>}
                                        {visibleColumns.unique_clicks && <td>{row.unique_clicks}</td>}
                                        {visibleColumns.clicks && <td>{row.clicks}</td>}
                                        {visibleColumns.conversions && <td>{row.conversions}</td>}
                                        {visibleColumns.cr && <td>{row.cr}%</td>}
                                        {visibleColumns.epc && <td>${row.epc}</td>}
                                        {visibleColumns.payout && <td>${row.payout.toFixed(2)}</td>}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center" style={{padding: '3rem', color: '#94a3b8'}}>
                                        No data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {processedData.length > 0 && (
                            <tfoot>
                                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                                    {visibleColumns.date && <td>TOTAL</td>}
                                    {visibleColumns.campaignName && <td>-</td>}
                                    {visibleColumns.goalName && <td>-</td>}
                                    {visibleColumns.source && <td>-</td>}
                                    {visibleColumns.unique_clicks && <td>{processedData.reduce((a,c)=>a+(c.unique_clicks||0), 0)}</td>}
                                    {visibleColumns.clicks && <td>{processedData.reduce((a,c)=>a+(c.clicks||0), 0)}</td>}
                                    {visibleColumns.conversions && <td>{processedData.reduce((a,c)=>a+(c.conversions||0), 0)}</td>}
                                    {visibleColumns.cr && <td>{(processedData.reduce((a,c)=>a+(c.conversions||0),0)/processedData.reduce((a,c)=>a+(c.clicks||1), 1)*100).toFixed(2)}%</td>}
                                    {visibleColumns.epc && <td>${(processedData.reduce((a,c)=>a+(c.payout||0),0)/processedData.reduce((a,c)=>a+(c.clicks||1),1)).toFixed(4)}</td>}
                                    {visibleColumns.payout && <td>${processedData.reduce((a,c)=>a+(c.payout||0),0).toFixed(2)}</td>}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'Campaigns' && (
            <div className="card">
                <div className="card-header">
                    <h3>Available Campaigns</h3>
                </div>
                <div style={{padding:'2rem', textAlign:'center', color:'#94a3b8'}}>
                    Campaign list would go here.
                </div>
            </div>
          )}
          
          {activeTab === 'Dashboard' && (
             <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-info">
                    <h4>Total Clicks</h4>
                    <h2>{stats.clicks}</h2>
                  </div>
                </div>
                 <div className="stat-card">
                  <div className="stat-info">
                    <h4>Conversions</h4>
                    <h2>{stats.conversions}</h2>
                  </div>
                </div>
                 <div className="stat-card">
                  <div className="stat-info">
                    <h4>Revenue</h4>
                    <h2>${stats.payout.toFixed(2)}</h2>
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'Profile' && (
            <div className="card" style={{overflow: 'hidden', padding: 0}}>
                <div style={{
                    height: '120px', 
                    background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                    position: 'relative'
                }}></div>
                
                <div style={{padding: '0 2rem 2rem 2rem', marginTop: '-40px', position: 'relative'}}>
                    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'}}>
                        <div style={{display: 'flex', alignItems: 'flex-end', gap: '1.5rem'}}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: '#fff',
                                padding: '4px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    background: '#e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2.5rem',
                                    color: '#64748b'
                                }}>
                                    {publisher.fullName.charAt(0)}
                                </div>
                            </div>
                            <div style={{marginBottom: '15px'}}>
                                <h2 style={{margin: 0, fontSize: '1.5rem', color: '#1e293b'}}>{publisher.fullName}</h2>
                                <p style={{margin: 0, color: '#64748b'}}>{publisher.email}</p>
                            </div>
                        </div>
                        <div style={{marginBottom: '10px'}}>
                             <span className={`badge ${publisher.status === 'Active' ? 'green' : 'orange'}`} style={{fontSize: '0.9rem', padding: '0.5rem 1rem'}}>
                                {publisher.status}
                             </span>
                        </div>
                    </div>

                    <div style={{marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem'}}>
                        <div style={{padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                            <label style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Company</label>
                            <div style={{fontSize: '1rem', color: '#334155', fontWeight: '500'}}>{publisher.company || '-'}</div>
                        </div>
                        <div style={{padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                            <label style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Publisher ID</label>
                            <div style={{fontSize: '1rem', color: '#334155', fontWeight: '500'}}>#{publisher.id}</div>
                        </div>
                        <div style={{padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                            <label style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Reference ID</label>
                            <div style={{fontSize: '1rem', color: '#334155', fontWeight: '500'}}>{publisher.referenceId || '-'}</div>
                        </div>
                        <div style={{padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9'}}>
                            <label style={{display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase'}}>Country</label>
                            <div style={{fontSize: '1rem', color: '#334155', fontWeight: '500'}}>{publisher.country || 'IN'}</div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'Global Postback' && (
            <div className="card">
                <div className="card-header">
                    <h3>Global Postback Settings</h3>
                </div>
                <div style={{padding:'2rem', textAlign:'center', color:'#94a3b8'}}>
                    Configure your global postback URL here.
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublisherDashboard;
