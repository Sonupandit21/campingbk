import React, { useState, useEffect, useRef } from 'react';
import './ManagePublishers.css';

const ManagePublishers = ({ onAddPublisher, onEditPublisher, onDeletePublisher, onLoginAs, publishers = [] }) => {
  const [openActionId, setOpenActionId] = useState(null);
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);
  const columnsRef = useRef(null);

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    email: '',
    status: {
      Active: false,
      Pending: false,
      Disabled: false,
      Rejected: false,
      Banned: false
    }
  });

  // Column State
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    email: true,
    status: true,
    referenceId: true,
    postbackUrl: true,
    action: true
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionId(null);
      }
      if (columnsRef.current && !columnsRef.current.contains(event.target)) {
        setShowColumns(false);
      }
      // Don't close filters on outside click for now, easier to use if it stays open or clear close button
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleAction = (id) => {
    if (openActionId === id) {
      setOpenActionId(null);
    } else {
      setOpenActionId(id);
    }
  };

  // Filter Logic
  const filteredPublishers = publishers.filter(pub => {
    const matchId = !filters.id || pub.id.toString().includes(filters.id);
    const matchName = !filters.name || (pub.fullName || '').toLowerCase().includes(filters.name.toLowerCase()) || (pub.company || '').toLowerCase().includes(filters.name.toLowerCase());
    const matchEmail = !filters.email || (pub.email || '').toLowerCase().includes(filters.email.toLowerCase());
    
    // Status check
    const activeStatuses = Object.keys(filters.status).filter(key => filters.status[key]);
    const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(pub.status);

    return matchId && matchName && matchEmail && matchStatus;
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({
      ...prev,
      status: { ...prev.status, [status]: !prev.status[status] }
    }));
  };

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <div className="card">
      <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h3>Manage Publishers</h3>
          <span className="subtitle">View and manage all your publishers</span>
        </div>
        <div style={{display: 'flex', gap: '10px'}}>
           <div style={{position: 'relative'}} ref={columnsRef}>
             <button 
               onClick={() => setShowColumns(!showColumns)}
               className="btn-secondary"
               style={{background:'white', border:'1px solid #e2e8f0', color:'#64748b', padding:'0.5rem 1rem', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}
             >
               <span>👁</span> Columns
             </button>
             {showColumns && (
               <div className="column-dropdown">
                 {Object.keys(visibleColumns).map(col => (
                   <label key={col} className="column-item">
                     <input 
                       type="checkbox" 
                       checked={visibleColumns[col]} 
                       onChange={() => toggleColumn(col)}
                       disabled={col === 'action'} // Always keep action visible
                     />
                     {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                   </label>
                 ))}
               </div>
             )}
           </div>

           <button 
             onClick={() => setShowFilters(!showFilters)}
             className={`btn-secondary ${showFilters ? 'active' : ''}`}
             style={{background: showFilters ? '#eff6ff' : 'white', border: showFilters ? '1px solid #3b82f6' : '1px solid #e2e8f0', color: showFilters ? '#3b82f6' : '#64748b', padding:'0.5rem 1rem', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}
           >
             <span>⚡</span> Filter
           </button>

           <button 
             onClick={onAddPublisher}
             style={{
                background: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
             }}
           >
             <span>+</span> Add Publisher
           </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Publisher ID</label>
            <input 
              type="text" 
              placeholder="Enter Publisher id" 
              value={filters.id}
              onChange={(e) => handleFilterChange('id', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Contact/Company Name</label>
            <input 
              type="text" 
              placeholder="Enter Name" 
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <div className="checkbox-group">
              {Object.keys(filters.status).map(status => (
                <label key={status} className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={filters.status[status]} 
                    onChange={() => handleStatusChange(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Email</label>
            <input 
              type="text" 
              placeholder="Enter Publisher Email" 
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="table-responsive">
        <table className="custom-table" style={{minHeight: '200px'}}>
          <thead>
            <tr>
              {visibleColumns.id && <th>ID</th>}
              {visibleColumns.name && <th>Name</th>}
              {visibleColumns.email && <th>Email</th>}
              {visibleColumns.status && <th>Status</th>}
              {visibleColumns.referenceId && <th>Reference ID</th>}
              {visibleColumns.postbackUrl && <th>Postback URL</th>}
              {visibleColumns.action && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPublishers.length > 0 ? (
                filteredPublishers.map((pub) => (
                    <tr key={pub.id}>
                        {visibleColumns.id && <td>{pub.id}</td>}
                        {visibleColumns.name && <td>{pub.fullName}</td>}
                        {visibleColumns.email && <td>{pub.email}</td>}
                        {visibleColumns.status && (
                            <td>
                                <span className={`badge ${pub.status === 'Active' ? 'green' : 'orange'}`}>
                                    {pub.status}
                                </span>
                            </td>
                        )}
                        {visibleColumns.referenceId && <td>{pub.referenceId || '-'}</td>}
                        {visibleColumns.postbackUrl && (
                            <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {pub.postbackUrl || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Not set</span>}
                            </td>
                        )}
                        {visibleColumns.action && (
                            <td style={{overflow: 'visible'}}>
                                <div className="action-menu-container" ref={openActionId === pub.id ? dropdownRef : null}>
                                    <button 
                                        className={`btn-action-trigger ${openActionId === pub.id ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); toggleAction(pub.id); }}
                                    >
                                        ⋮
                                    </button>
                                    {openActionId === pub.id && (
                                        <div className="action-dropdown">
                                            <button className="action-item" onClick={() => { onEditPublisher(pub); setOpenActionId(null); }}>
                                                <span className="icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#f59e0b'}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </span> 
                                                Edit
                                            </button>
                                            <button className="action-item delete" onClick={() => { onDeletePublisher(pub.id); setOpenActionId(null); }}>
                                                <span className="icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#ef4444'}}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                </span> 
                                                Delete
                                            </button>
                                            <button className="action-item" onClick={() => { onLoginAs(pub); setOpenActionId(null); }}>
                                                <span className="icon">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#64748b'}}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                                </span> 
                                                Login as
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        )}
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="6" className="text-center" style={{padding: '3rem', color: '#94a3b8'}}>
                        No publishers found. Use the "Add Publisher" button to create one.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagePublishers;
