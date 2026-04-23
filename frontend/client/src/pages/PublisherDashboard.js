import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  MousePointer2, 
  Target, 
  TrendingUp, 
  Globe, 
  User as UserIcon,
  Filter,
  Columns,
  RefreshCw,
  MoreVertical,
  Activity,
  Download
} from 'lucide-react';
import './PublisherDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const PublisherDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const getPastDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // State
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [startDate, setStartDate] = useState(getPastDate(7));
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedIp, setDetectedIp] = useState('');
  const [stats, setStats] = useState({ clicks: 0, conversions: 0, payout: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showColumnOptions, setShowColumnOptions] = useState(false);

  // Responsive Sidebar Check
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    campaignName: true,
    goalName: true,
    source: true,
    clicks: true,
    conversions: true,
    cr: true,
    payout: true
  });

  const publisher = user || { fullName: 'Publisher', id: 0, email: '', status: 'Active' };

  // Verify auth
  useEffect(() => {
    if (!user) {
      navigate('/publisher/login');
      return;
    }
    if (user.role !== 'publisher') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch IP
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

  // Fetch Report Data
  const fetchReportData = async () => {
    if (!publisher.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const query = `?publisherId=${publisher.id}&startDate=${startDate}&endDate=${endDate}`; 
      const response = await fetch(`${BACKEND_URL}/api/reports${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        
        // Totals
        const totalClicks = data.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
        const totalConversions = data.reduce((acc, curr) => acc + (curr.conversions || 0), 0);
        const totalPayout = data.reduce((acc, curr) => acc + (curr.payout || 0), 0);
        
        setStats({ clicks: totalClicks, conversions: totalConversions, payout: totalPayout });
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Dashboard' || activeTab === 'Manage') {
      fetchReportData();
    }
  }, [activeTab, publisher.id, startDate, endDate]);

  const dailyBreakdown = useMemo(() => {
    const map = new Map();
    reportData.forEach(r => {
      const d = r.date || 'Unknown';
      const c = r.campaignName || 'Unknown';
      const key = `${d}|${c}`;
      if (!map.has(key)) map.set(key, { date: d, campaignName: c, clicks: 0, conversions: 0 });
      const entry = map.get(key);
      entry.clicks += (r.clicks || 0);
      entry.conversions += (r.conversions || 0);
    });
    return Array.from(map.values())
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .map(item => ({
        ...item,
        cr: item.clicks > 0 ? ((item.conversions / item.clicks) * 100).toFixed(2) : 0
      }))
      .slice(0, 5); // Show top 5 recent results
  }, [reportData]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown') return dateString;
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Processed Table Data
  const processedData = useMemo(() => {
    let data = [...reportData];

    // Aggregation
    if (!visibleColumns.date || !visibleColumns.source) {
      const aggMap = new Map();
      data.forEach(row => {
        const dateKey = visibleColumns.date ? (row.date || '') : 'ALL';
        const sourceKey = visibleColumns.source ? (row.source || '') : 'ALL';
        const campKey = row.campaignName || '';
        const key = `${dateKey}|${sourceKey}|${campKey}`;

        if (!aggMap.has(key)) {
          aggMap.set(key, {
            ...row,
            date: visibleColumns.date ? row.date : 'All Dates',
            source: visibleColumns.source ? row.source : '',
            clicks: 0,
            conversions: 0,
            payout: 0
          });
        }
        const entry = aggMap.get(key);
        entry.clicks += (row.clicks || 0);
        entry.conversions += (row.conversions || 0);
        entry.payout += (row.payout || 0);
      });
      data = Array.from(aggMap.values()).map(row => ({
        ...row,
        cr: row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : 0
      }));
    }

    // Search
    if (searchTerm) {
      const st = searchTerm.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(v => String(v).toLowerCase().includes(st))
      );
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        let av = a[sortConfig.key];
        let bv = b[sortConfig.key];
        if (['clicks', 'conversions', 'cr', 'payout'].includes(sortConfig.key)) {
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

  const handleDownloadExcel = () => {
    if (processedData.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const excelData = processedData.map(row => {
      const exportRow = {};
      
      if (visibleColumns.date) exportRow['Date'] = row.date;
      if (visibleColumns.campaignName) exportRow['Campaign'] = row.campaignName;
      if (visibleColumns.goalName) exportRow['Goal'] = row.goalName || 'N/A';
      if (visibleColumns.source) exportRow['Source'] = row.source || '';
      if (visibleColumns.clicks) exportRow['Clicks'] = row.clicks || 0;
      if (visibleColumns.conversions) exportRow['Conversions'] = row.conversions || 0;
      if (visibleColumns.payout) exportRow['Payout'] = row.payout || 0;
      if (visibleColumns.cr) exportRow['CR %'] = `${row.cr}%`;

      return exportRow;
    });

    // Add Totals Row
    const totalsRow = {};
    if (visibleColumns.date) totalsRow['Date'] = 'TOTAL';
    if (visibleColumns.clicks) totalsRow['Clicks'] = processedData.reduce((a, c) => a + (c.clicks || 0), 0);
    if (visibleColumns.conversions) totalsRow['Conversions'] = processedData.reduce((a, c) => a + (c.conversions || 0), 0);
    if (visibleColumns.payout) totalsRow['Payout'] = processedData.reduce((a, c) => a + (c.payout || 0), 0);
    if (visibleColumns.cr) {
        const totalClicks = processedData.reduce((a, c) => a + (c.clicks || 0), 0);
        const totalConversions = processedData.reduce((a, c) => a + (c.conversions || 0), 0);
        totalsRow['CR %'] = totalClicks > 0 ? `${((totalConversions / totalClicks) * 100).toFixed(2)}%` : '0%';
    }
    
    excelData.push(totalsRow);

    // Create sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Publisher_Reports");

    // Generate filename
    const fileName = `Publisher_Report_${startDate}_to_${endDate}.xlsx`;
    
    // Export file
    XLSX.writeFile(workbook, fileName);
  };

  const handleLogout = () => {
    logout();
    navigate('/publisher/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="pub-dashboard">
      {/* Sidebar */}
      <aside className={`pub-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="pub-sidebar-logo">
          <div className="logo-icon">
            <Activity size={22} color="white" />
          </div>
          <span className="logo-text">Trackier Panel</span>
        </div>
        
        <nav className="pub-nav">
          <div className="nav-section-title">{isSidebarOpen ? 'Main Menu' : '•••'}</div>
          <button 
            className={`pub-nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('Dashboard')}
          >
            <LayoutDashboard size={22} className="icon" />
            {isSidebarOpen && <span className="label">Dashboard</span>}
          </button>
          <button 
            className={`pub-nav-item ${activeTab === 'Manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('Manage')}
          >
            <BarChart3 size={22} className="icon" />
            {isSidebarOpen && <span className="label">Manage</span>}
          </button>
          
          <div className="nav-section-title" style={{ marginTop: '12px' }}>{isSidebarOpen ? 'Personal' : '•••'}</div>
          <button 
            className={`pub-nav-item ${activeTab === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('Profile')}
          >
            <Users size={22} className="icon" />
            {isSidebarOpen && <span className="label">My Profile</span>}
          </button>
          <button 
            className={`pub-nav-item ${activeTab === 'Global Postback' ? 'active' : ''}`}
            onClick={() => setActiveTab('Global Postback')}
          >
            <Globe size={22} className="icon" />
            {isSidebarOpen && <span className="label">Postbacks</span>}
          </button>
          
          <button 
            className="pub-nav-item danger" 
            onClick={handleLogout}
            style={{ marginTop: 'auto', marginBottom: '20px' }}
          >
            <LogOut size={22} className="icon" />
            {isSidebarOpen && <span className="label">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="pub-main">
        {/* Header */}
        <header className="pub-header">
           <button className="sidebar-toggle" onClick={toggleSidebar}>
              <Menu size={20} />
           </button>

           <div className="header-right">
              <Bell size={20} className="action-icon" />
              <div className="user-pill" onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ position: 'relative' }}>
                  <div className="user-avatar-small">{publisher.fullName.charAt(0)}</div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', display: isSidebarOpen ? 'block' : 'none' }}>
                    {publisher.fullName}
                  </span>
                  <ChevronDown size={16} color="var(--text-muted)" />
                  
                  {showProfileMenu && (
                    <div className="dropdown-profile">
                        <button className="dropdown-item-pub" onClick={() => setActiveTab('Profile')}>
                            <UserIcon size={18} /> My Profile
                        </button>
                        <button className="dropdown-item-pub" onClick={() => setActiveTab('Settings')}>
                            <Settings size={18} /> Settings
                        </button>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>
                        <button className="dropdown-item-pub danger" onClick={handleLogout}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                  )}
              </div>
           </div>
        </header>

        {/* Dynamic Content */}
        <div className="pub-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px' }}>
              <div>
                  <h1 className="pub-page-title">{activeTab}</h1>
                  <p className="pub-page-subtitle" style={{ marginBottom: 0 }}>Your publisher performance overview and management.</p>
              </div>
              
              {(activeTab === 'Dashboard' || activeTab === 'Manage') && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.95rem', color: '#475569', fontWeight: '500' }}>Start Date</label>
                         <input 
                             type="date" 
                             className="pub-input" 
                             value={startDate} 
                             onChange={(e) => setStartDate(e.target.value)} 
                             style={{ minWidth: '180px', color: '#0f172a', fontWeight: '500', padding: '10px 16px', background: 'white', cursor: 'pointer' }} 
                         />
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <label style={{ fontSize: '0.95rem', color: '#475569', fontWeight: '500' }}>End Date</label>
                         <input 
                             type="date" 
                             className="pub-input" 
                             value={endDate} 
                             onChange={(e) => setEndDate(e.target.value)} 
                             style={{ minWidth: '180px', color: '#0f172a', fontWeight: '500', padding: '10px 16px', background: 'white', cursor: 'pointer' }} 
                         />
                     </div>
                  </div>
              )}
          </div>

          {activeTab === 'Dashboard' && (
            <>
            <div className="pub-stats-grid">
               <div className="pub-stat-card" style={{ border: '1px solid #a5b4fc', borderRadius: '16px', padding: '24px' }}>
                  <div className="stat-card-row" style={{ marginBottom: '16px' }}>
                      <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Total Clicks</span>
                      <div className="stat-icon-box" style={{ background: '#eef2ff', color: '#4f46e5', width: '40px', height: '40px', borderRadius: '12px' }}>
                          <MousePointer2 size={20} />
                      </div>
                  </div>
                  <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>{stats.clicks.toLocaleString()}</h2>
               </div>

               <div className="pub-stat-card" style={{ border: '1px solid #a5b4fc', borderRadius: '16px', padding: '24px' }}>
                  <div className="stat-card-row" style={{ marginBottom: '16px' }}>
                      <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Conversions</span>
                      <div className="stat-icon-box" style={{ background: '#eef2ff', color: '#4f46e5', width: '40px', height: '40px', borderRadius: '12px' }}>
                          <Target size={20} />
                      </div>
                  </div>
                  <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>{stats.conversions.toLocaleString()}</h2>
               </div>

               <div className="pub-stat-card" style={{ border: '1px solid #a5b4fc', borderRadius: '16px', padding: '24px' }}>
                  <div className="stat-card-row" style={{ marginBottom: '16px' }}>
                      <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Earnings (Payout)</span>
                      <div className="stat-icon-box" style={{ background: '#eef2ff', color: '#4f46e5', width: '40px', height: '40px', borderRadius: '12px' }}>
                          <TrendingUp size={20} />
                      </div>
                  </div>
                  <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>₹{stats.payout.toLocaleString()}</h2>
               </div>

               <div className="pub-stat-card" style={{ border: '1px solid #a5b4fc', borderRadius: '16px', padding: '24px' }}>
                  <div className="stat-card-row" style={{ marginBottom: '16px' }}>
                      <span className="stat-label" style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>Avg CR%</span>
                      <div className="stat-icon-box" style={{ background: '#ecfdf5', color: '#10b981', width: '40px', height: '40px', borderRadius: '12px' }}>
                          <Activity size={20} />
                      </div>
                  </div>
                  <h2 className="stat-value" style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>{(stats.conversions / (stats.clicks || 1) * 100).toFixed(2)}%</h2>
               </div>
            </div>

            {/* Daily Breakdown */}
            <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: '#1e293b' }}>Daily breakdown</h3>
                    <button style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', outline: 'none' }} onClick={() => setActiveTab('Manage')}>
                        View full report
                    </button>
                </div>

                <div className="pub-table-card" style={{ background: '#fcfcfc', border: '1px solid #e5e7eb', borderRadius: '16px' }}>
                    <table className="pub-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
                        <thead>
                            <tr>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>Date</th>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>Campaign</th>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>Clicks</th>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>Conversions</th>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>Payout</th>
                                <th style={{ background: '#f5f5f4', padding: '16px 24px', color: '#57534e', borderBottom: '1px solid #e7e5e4' }}>CR%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyBreakdown.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f0fdf4', background: '#ffffff' }}>
                                    <td style={{ padding: '16px 24px', color: '#334155', fontWeight: '500' }}>{formatDate(row.date)}</td>
                                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600' }}>{row.campaignName}</td>
                                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '500' }}>{row.clicks.toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700' }}>
                                            {row.conversions.toLocaleString()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: '600' }}>₹{(row.payout || 0).toLocaleString()}</td>
                                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#0f172a' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ minWidth: '45px' }}>{row.cr}%</span>
                                            <div style={{ width: '24px', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(row.cr, 100)}%`, height: '100%', background: '#4f46e5', borderRadius: '2px' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {dailyBreakdown.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: '#64748b', background: '#ffffff' }}>No data available for this range.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {dailyBreakdown.length > 0 && (
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 24px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>
                        Total ({dailyBreakdown.length} days)
                    </div>
                    <div style={{ display: 'flex', gap: '32px', marginRight: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Clicks</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                {dailyBreakdown.reduce((a, c) => a + c.clicks, 0).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Conversions</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                {dailyBreakdown.reduce((a, c) => a + c.conversions, 0).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '2px' }}>Avg CR%</div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                {(dailyBreakdown.reduce((a, c) => a + c.conversions, 0) / (dailyBreakdown.reduce((a, c) => a + c.clicks, 0) || 1) * 100).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
            </>
          )}

          {activeTab === 'Manage' && (
            <div className="pub-table-card">
              <div className="pub-table-header">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      placeholder="Search reports..." 
                      className="pub-input"
                      style={{ paddingLeft: '40px', width: '260px' }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowColumnOptions(!showColumnOptions)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', border: '1px solid #a5b4fc', borderRadius: '12px', color: '#4f46e5', cursor: 'pointer', transition: 'all 0.3s' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>Columns</span>
                      <ChevronDown size={14} strokeWidth={3} />
                    </button>
                    {showColumnOptions && (
                      <div className="dropdown-profile" style={{ top: 'calc(100% + 8px)', right: 0 }}>
                           {Object.keys(visibleColumns).map(col => (
                              <label key={col} className="dropdown-item-pub" style={{ cursor: 'pointer' }}>
                                  <input 
                                      type="checkbox" 
                                      checked={visibleColumns[col]} 
                                      onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))} 
                                      style={{ marginRight: '10px' }}
                                  />
                                  {col === 'cr' ? 'CR%' : col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                              </label>
                           ))}
                      </div>
                    )}
                  </div>
                  <button 
                      onClick={handleDownloadExcel} 
                      style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          padding: '8px 16px', 
                          background: '#4f46e5', 
                          border: 'none', 
                          borderRadius: '12px', 
                          color: 'white', 
                          cursor: 'pointer', 
                          transition: 'all 0.3s',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                      }}
                      title="Download as Excel"
                  >
                      <Download size={18} />
                      Export
                  </button>
                  <button className="sidebar-toggle" onClick={fetchReportData}>
                      <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="pub-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {visibleColumns.date && <th onClick={() => setSortConfig({ key: 'date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>Date</th>}
                      {visibleColumns.campaignName && <th onClick={() => setSortConfig({ key: 'campaignName', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>Campaign</th>}
                      {visibleColumns.goalName && <th>Goal</th>}
                      {visibleColumns.source && <th>Source</th>}
                      {visibleColumns.clicks && <th onClick={() => setSortConfig({ key: 'clicks', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>Clicks</th>}
                      {visibleColumns.conversions && <th onClick={() => setSortConfig({ key: 'conversions', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>Conversions</th>}
                      {visibleColumns.payout && <th onClick={() => setSortConfig({ key: 'payout', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>Payout</th>}
                      {visibleColumns.cr && <th onClick={() => setSortConfig({ key: 'cr', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>CR%</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px' }}>Loading Data...</td></tr>
                    ) : processedData.length > 0 ? (
                      processedData.map((row, idx) => (
                        <tr key={idx} className="pub-table-row">
                          {visibleColumns.date && <td>{row.date}</td>}
                          {visibleColumns.campaignName && <td style={{ fontWeight: '600', color: 'var(--primary-dark)' }}>{row.campaignName}</td>}
                          {visibleColumns.goalName && <td><span className="badge-premium badge-blue">{row.goalName || 'N/A'}</span></td>}
                          {visibleColumns.source && <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{row.source || '-'}</td>}
                          {visibleColumns.clicks && <td>{row.clicks.toLocaleString()}</td>}
                          {visibleColumns.conversions && <td style={{ fontWeight: '700', color: 'var(--success)' }}>{row.conversions.toLocaleString()}</td>}
                          {visibleColumns.payout && <td style={{ fontWeight: '700', color: '#4f46e5' }}>₹{(row.payout || 0).toLocaleString()}</td>}
                          {visibleColumns.cr && <td>{row.cr}%</td>}
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No records found.</td></tr>
                    )}
                  </tbody>
                  {processedData.length > 0 && (
                      <tfoot style={{ background: '#f8fafc', fontWeight: '800' }}>
                          <tr>
                             {visibleColumns.date && <td>TOTAL</td>}
                             {visibleColumns.campaignName && <td>-</td>}
                             {visibleColumns.goalName && <td>-</td>}
                             {visibleColumns.source && <td>-</td>}
                             {visibleColumns.clicks && <td>{processedData.reduce((a,c)=>a+(c.clicks||0), 0).toLocaleString()}</td>}
                             {visibleColumns.conversions && <td>{processedData.reduce((a,c)=>a+(c.conversions||0), 0).toLocaleString()}</td>}
                             {visibleColumns.payout && <td style={{ color: '#4f46e5' }}>₹{processedData.reduce((a,c)=>a+(c.payout||0), 0).toLocaleString()}</td>}
                             {visibleColumns.cr && <td>{(processedData.reduce((a,c)=>a+(c.conversions||0),0)/processedData.reduce((a,c)=>a+(c.clicks||1), 1)*100).toFixed(2)}%</td>}
                          </tr>
                      </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="pub-table-card" style={{ padding: '0' }}>
               <div className="profile-banner"></div>
               <div className="profile-content">
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <div className="profile-avatar-giant">
                          <div className="avatar-giant-inner">{publisher.fullName.charAt(0)}</div>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                          <button className="pub-nav-item active" style={{ width: 'auto', padding: '12px 24px' }}>Edit Profile</button>
                      </div>
                  </div>
                  
                  <div style={{ marginTop: '24px' }}>
                      <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>{publisher.fullName}</h2>
                      <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{publisher.email}</p>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                          <span className="badge-premium badge-green">{publisher.status}</span>
                          <span className="badge-premium badge-blue">Publisher ID: #{publisher.id}</span>
                      </div>
                  </div>

                  <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                      <div style={{ padding: '24px', background: '#f1f5f9', borderRadius: '16px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Company</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{publisher.company || 'N/A'}</div>
                      </div>
                      <div style={{ padding: '24px', background: '#f1f5f9', borderRadius: '16px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Country</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{publisher.country || 'IN'}</div>
                      </div>
                      <div style={{ padding: '24px', background: '#f1f5f9', borderRadius: '16px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Reference ID</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{publisher.referenceId || 'N/A'}</div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {(activeTab === 'Global Postback' || activeTab === 'Settings') && (
            <div className="pub-table-card" style={{ padding: '80px', textAlign: 'center' }}>
                <Globe size={60} color="var(--primary)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activeTab} Module</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '8px auto 0' }}>
                   This section is under maintenance. We are upgrading the configuration tools to provide you with more control over your tracking parameters.
                </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublisherDashboard;
