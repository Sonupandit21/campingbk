import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import './Reports.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const Reports = () => {
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], // Last 7 days
        endDate: new Date().toISOString().split('T')[0],
        campaignId: '',
        publisherId: ''
    });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [publishers, setPublishers] = useState([]);
    const [totals, setTotals] = useState({ gross_clicks: 0, clicks: 0, unique_clicks: 0, sampled_clicks: 0, conversions: 0, gross_conversions: 0, sampled_conversions: 0, payout: 0 });
    
    // New Feature States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        campaignId: true,
        campaignName: true,
        goalName: true,
        publisherId: true,
        publisherName: true,
        source: true,
        gross_clicks: true,
        clicks: true,
        unique_clicks: true,
        sampled_clicks: true,
        gross_conversions: true,
        sampled_conversions: true,
        conversions: true,
        cr: true,
        epc: true,
        payout: true
    });
    const [showColumnOptions, setShowColumnOptions] = useState(false);
    const tableContainerRef = useRef(null);

    const scrollTable = (direction) => {
        if (tableContainerRef.current) {
            const scrollAmount = 300;
            tableContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        fetchOptions();
        fetchReports();
    }, []);

    const fetchOptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [campRes, pubRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/campaigns`, { headers }),
                fetch(`${BACKEND_URL}/api/publishers`, { headers })
            ]);
            if (campRes.ok) setCampaigns(await campRes.json());
            if (pubRes.ok) setPublishers(await pubRes.json());
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filters);
            if (!filters.campaignId) params.delete('campaignId');
            if (!filters.publisherId) params.delete('publisherId');

            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/reports?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReportData(data);
                
                // Calculate totals
                const newTotals = data.reduce((acc, row) => ({
                    gross_clicks: acc.gross_clicks + (row.gross_clicks || 0),
                    clicks: acc.clicks + (row.clicks || 0),
                    unique_clicks: acc.unique_clicks + (row.unique_clicks || 0),
                    sampled_clicks: acc.sampled_clicks + (row.sampled_clicks || 0),
                    conversions: acc.conversions + (row.conversions || 0),
                    gross_conversions: acc.gross_conversions + (row.gross_conversions || 0),
                    sampled_conversions: acc.sampled_conversions + (row.sampled_conversions || 0),
                    payout: acc.payout + (row.payout || 0)
                }), { gross_clicks: 0, clicks: 0, unique_clicks: 0, sampled_clicks: 0, conversions: 0, gross_conversions: 0, sampled_conversions: 0, payout: 0 });
                setTotals(newTotals);
            } else {
                console.error('Failed to fetch reports');
            }
        } catch (error) {
            console.error('Report fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRunReport = (e) => {
        e.preventDefault();
        fetchReports();
    };

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

    const handleDownloadExcel = () => {
        if (processedData.length === 0) {
            alert('No data to export');
            return;
        }

        // Prepare data for Excel
        const excelData = processedData.map(row => {
            const exportRow = {};
            
            if (visibleColumns.date) exportRow['Date'] = row.date;
            if (visibleColumns.campaignId) exportRow['Camp ID'] = row.camp_id;
            if (visibleColumns.campaignName) exportRow['Campaign'] = row.campaignName;
            if (visibleColumns.goalName) exportRow['Goal Name'] = row.goalName;
            if (visibleColumns.publisherId) exportRow['Pub ID'] = row.publisher_id;
            if (visibleColumns.publisherName) exportRow['Publisher'] = row.publisherName;
            if (visibleColumns.source) exportRow['Source'] = row.source;
            if (visibleColumns.gross_clicks) exportRow['Gross Clicks'] = row.gross_clicks || 0;
            if (visibleColumns.clicks) exportRow['Clicks'] = row.clicks || 0;
            if (visibleColumns.unique_clicks) exportRow['Unique Clicks'] = row.unique_clicks || 0;
            if (visibleColumns.sampled_clicks) exportRow['Sampled Clicks'] = row.sampled_clicks || 0;
            if (visibleColumns.gross_conversions) exportRow['Gross Conversions'] = row.gross_conversions || 0;
            if (visibleColumns.sampled_conversions) exportRow['Sampled Conversions'] = row.sampled_conversions || 0;
            if (visibleColumns.conversions) exportRow['Conversions'] = row.conversions || 0;
            if (visibleColumns.cr) exportRow['CR %'] = `${row.cr}%`;
            if (visibleColumns.epc) exportRow['EPC'] = `${row.epc}`;
            if (visibleColumns.payout) exportRow['Payout'] = row.payout;

            return exportRow;
        });

        // Add Totals Row
        const totalsRow = {};
        if (visibleColumns.date) totalsRow['Date'] = 'TOTAL';
        if (visibleColumns.gross_clicks) totalsRow['Gross Clicks'] = totals.gross_clicks;
        if (visibleColumns.clicks) totalsRow['Clicks'] = totals.clicks;
        if (visibleColumns.unique_clicks) totalsRow['Unique Clicks'] = totals.unique_clicks;
        if (visibleColumns.sampled_clicks) totalsRow['Sampled Clicks'] = totals.sampled_clicks;
        if (visibleColumns.gross_conversions) totalsRow['Gross Conversions'] = totals.gross_conversions;
        if (visibleColumns.sampled_conversions) totalsRow['Sampled Conversions'] = totals.sampled_conversions;
        if (visibleColumns.conversions) totalsRow['Conversions'] = totals.conversions;
        if (visibleColumns.cr) totalsRow['CR %'] = `${(totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) : 0)}%`;
        if (visibleColumns.epc) totalsRow['EPC'] = `${(totals.clicks > 0 ? totals.payout / totals.clicks : 0).toFixed(4)}`;
        if (visibleColumns.payout) totalsRow['Payout'] = totals.payout;
        
        excelData.push(totalsRow);

        // Create sheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

        // Generate filename
        const fileName = `Reports_${filters.startDate}_to_${filters.endDate}.xlsx`;
        
        // Export file
        XLSX.writeFile(workbook, fileName);
    };

    // Filter and Sort Logic
    const processedData = React.useMemo(() => {
        let data = [...reportData];

        // 1. Aggregation Logic (If Date, Source, publisherId, or campaignId is hidden, sum up rows)
        if (!visibleColumns.date || !visibleColumns.source || !visibleColumns.publisherId || !visibleColumns.campaignId) {
            const aggregatedMap = new Map();

            data.forEach(row => {
                // Determine grouping keys based on visibility
                const dateKey = visibleColumns.date ? (row.date || '') : 'ALL';
                const campKey = visibleColumns.campaignId ? (row.camp_id || '') : 'ALL';
                const pubKey = visibleColumns.publisherId ? (row.publisher_id || '') : 'ALL';
                const sourceKey = visibleColumns.source ? (row.source || '') : 'ALL';

                const key = `${dateKey}|${campKey}|${pubKey}|${sourceKey}`;
                
                if (!aggregatedMap.has(key)) {
                    aggregatedMap.set(key, { 
                        ...row,
                        date: visibleColumns.date ? row.date : 'All Dates',
                        source: visibleColumns.source ? row.source : '', 
                        camp_id: visibleColumns.campaignId ? row.camp_id : 'All',
                        campaignName: visibleColumns.campaignId ? row.campaignName : 'All Campaigns',
                        publisher_id: visibleColumns.publisherId ? row.publisher_id : 'All',
                        publisherName: visibleColumns.publisherId ? row.publisherName : 'All Publishers',
                        gross_clicks: 0,
                        clicks: 0,
                        unique_clicks: 0,
                        sampled_clicks: 0,
                        conversions: 0,
                        gross_conversions: 0,
                        sampled_conversions: 0,
                        payout: 0
                    });
                }

                const entry = aggregatedMap.get(key);
                entry.gross_clicks = (entry.gross_clicks || 0) + (row.gross_clicks || 0);
                entry.clicks = (entry.clicks || 0) + (row.clicks || 0);
                entry.unique_clicks = (entry.unique_clicks || 0) + (row.unique_clicks || 0);
                entry.sampled_clicks = (entry.sampled_clicks || 0) + (row.sampled_clicks || 0);
                entry.conversions = (entry.conversions || 0) + (row.conversions || 0);
                entry.gross_conversions = (entry.gross_conversions || 0) + (row.gross_conversions || 0);
                entry.sampled_conversions = (entry.sampled_conversions || 0) + (row.sampled_conversions || 0);
                entry.payout = (entry.payout || 0) + (row.payout || 0);
            });

            // Convert map to array and recalculate ratios
            data = Array.from(aggregatedMap.values()).map(row => ({
                ...row,
                cr: row.clicks > 0 ? ((row.conversions / row.clicks) * 100).toFixed(2) : 0,
                epc: row.clicks > 0 ? (row.payout / row.clicks).toFixed(4) : 0
            }));
        }

        // 2. Global Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(row => 
                Object.values(row).some(val => 
                    String(val).toLowerCase().includes(lowerTerm)
                )
            );
        }

        // 3. Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                // Handle numeric strings like "12.50" or currency "$10.00"
                if (['cr', 'epc', 'payout', 'gross_clicks', 'clicks', 'unique_clicks', 'sampled_clicks', 'conversions', 'gross_conversions', 'sampled_conversions'].includes(sortConfig.key)) {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [reportData, searchTerm, sortConfig, visibleColumns.date, visibleColumns.source, visibleColumns.publisherId, visibleColumns.campaignId, visibleColumns.publisherName, visibleColumns.campaignName]);

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2>Reports</h2>
                
                {/* Main Filter Bar */}
                <div className="filter-bar">
                    <div className="filter-group">
                        <label>Start Date</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-group">
                        <label>End Date</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-group">
                        <label>Campaign</label>
                        <select name="campaignId" value={filters.campaignId} onChange={handleFilterChange}>
                            <option value="">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id || c.campaignId} value={c.campaignId}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Publisher</label>
                        <select name="publisherId" value={filters.publisherId} onChange={handleFilterChange}>
                            <option value="">All Publishers</option>
                            {publishers.map(p => (
                                <option key={p.id || p.publisherId} value={p.publisherId}>{p.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <button className="run-btn" onClick={handleRunReport} style={{ marginRight: '10px' }}>
                        {loading ? 'Running...' : 'Run Report'}
                    </button>
                    <button 
                        onClick={() => fetchReports()} 
                        style={{ 
                            padding: '8px 16px',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            marginRight: '10px'
                        }}
                        title="Refresh report data"
                    >
                        🔄 Refresh
                    </button>
                    <button 
                        onClick={handleDownloadExcel}
                        style={{ 
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        title="Download as Excel"
                    >
                        📥 Download Excel
                    </button>
                </div>

                {/* Secondary Bar: Search & Columns */}
                <div className="secondary-bar" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
                    <div className="search-box">
                         <input 
                            type="text" 
                            placeholder="Search in reports..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '250px' }}
                         />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Scroll Controls */}
                        <div className="scroll-controls">
                            <button className="scroll-btn" onClick={() => scrollTable('left')} title="Scroll Left">←</button>
                            <button className="scroll-btn" onClick={() => scrollTable('right')} title="Scroll Right">→</button>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowColumnOptions(!showColumnOptions)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#fff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: '#475569',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {showColumnOptions ? 'Hide Columns' : 'Select Columns'} ▾
                            </button>
                            
                            {showColumnOptions && (
                                <div className="column-toggles" style={{ 
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    zIndex: 1000,
                                    marginTop: '5px',
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    gap: '8px', 
                                    background: 'white',
                                    padding: '15px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    minWidth: '200px'
                                }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f1f5f9', paddingBottom: '5px', marginBottom: '5px' }}>Visible Columns:</span>
                                    {Object.keys(visibleColumns).map(col => (
                                        <label key={col} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', color: '#334155' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumns[col]} 
                                                onChange={() => toggleColumn(col)} 
                                                style={{ accentColor: '#3b82f6' }}
                                            />
                                             {col === 'campaignName' ? 'Campaign' : 
                                             col === 'goalName' ? 'Goal Name' :
                                             col === 'source' ? 'Source' :
                                             col === 'publisherName' ? 'Publisher' :
                                             col === 'gross_clicks' ? 'Gross Clicks' :
                                             col === 'unique_clicks' ? 'Unique Clicks' :
                                             col === 'sampled_clicks' ? 'Sampled Clicks' :
                                             col === 'gross_conversions' ? 'Gross' :
                                             col === 'sampled_conversions' ? 'Sampled' :
                                             col === 'campaignId' ? 'Camp ID' :
                                             col === 'publisherId' ? 'Pub ID' :
                                             col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-summary">
                 <div className="summary-card">
                    <h4>Gross Clicks</h4>
                    <h3>{totals.gross_clicks}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Total Clicks</h4>
                    <h3>{totals.clicks}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Unique Clicks</h4>
                    <h3>{totals.unique_clicks}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Sampled Clicks</h4>
                    <h3>{totals.sampled_clicks}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Total Conversions</h4>
                    <h3>{totals.conversions}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Gross Conversions</h4>
                    <h3>{totals.gross_conversions}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Sampled Conversions</h4>
                    <h3>{totals.sampled_conversions}</h3>
                 </div>
                 <div className="summary-card">
                    <h4>Total Payout</h4>
                    <h3>₹{totals.payout.toFixed(2)}</h3>
                 </div>
            </div>

            <div className="report-table-container" ref={tableContainerRef}>
                <table className="report-table">
                    <thead>
                        <tr>
                            {visibleColumns.date && <th onClick={() => handleSort('date')} style={{cursor: 'pointer'}}>Date {sortConfig.key==='date' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.campaignId && <th onClick={() => handleSort('camp_id')} style={{cursor: 'pointer'}}>Camp ID {sortConfig.key==='camp_id' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.campaignName && <th onClick={() => handleSort('campaignName')} style={{cursor: 'pointer'}}>Campaign {sortConfig.key==='campaignName' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.goalName && <th onClick={() => handleSort('goalName')} style={{cursor: 'pointer'}}>Goal Name {sortConfig.key==='goalName' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.publisherId && <th onClick={() => handleSort('publisher_id')} style={{cursor: 'pointer'}}>Pub ID {sortConfig.key==='publisher_id' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.publisherName && <th onClick={() => handleSort('publisherName')} style={{cursor: 'pointer'}}>Publisher {sortConfig.key==='publisherName' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.source && <th onClick={() => handleSort('source')} style={{cursor: 'pointer'}}>Source {sortConfig.key==='source' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.gross_clicks && <th onClick={() => handleSort('gross_clicks')} style={{cursor: 'pointer'}}>Gross Clicks {sortConfig.key==='gross_clicks' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.clicks && <th onClick={() => handleSort('clicks')} style={{cursor: 'pointer'}}>Clicks {sortConfig.key==='clicks' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.unique_clicks && <th onClick={() => handleSort('unique_clicks')} style={{cursor: 'pointer'}}>Unique {sortConfig.key==='unique_clicks' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.sampled_clicks && <th onClick={() => handleSort('sampled_clicks')} style={{cursor: 'pointer'}}>Sampled Clicks {sortConfig.key==='sampled_clicks' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.gross_conversions && <th onClick={() => handleSort('gross_conversions')} style={{cursor: 'pointer'}}>Gross {sortConfig.key==='gross_conversions' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.sampled_conversions && <th onClick={() => handleSort('sampled_conversions')} style={{cursor: 'pointer'}}>Sampled {sortConfig.key==='sampled_conversions' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.conversions && <th onClick={() => handleSort('conversions')} style={{cursor: 'pointer'}}>Conversions {sortConfig.key==='conversions' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.cr && <th onClick={() => handleSort('cr')} style={{cursor: 'pointer'}}>CR % {sortConfig.key==='cr' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.epc && <th onClick={() => handleSort('epc')} style={{cursor: 'pointer'}}>EPC {sortConfig.key==='epc' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                            {visibleColumns.payout && <th onClick={() => handleSort('payout')} style={{cursor: 'pointer'}}>Payout {sortConfig.key==='payout' && (sortConfig.direction==='asc'?'↑':'↓')}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={Object.values(visibleColumns).filter(v => v).length} className="text-center">Loading data...</td></tr>
                        ) : processedData.length === 0 ? (
                            <tr><td colSpan={Object.values(visibleColumns).filter(v => v).length} className="text-center">No data found for selected period</td></tr>
                        ) : (
                            processedData.map((row, index) => (
                                <tr key={index}>
                                    {visibleColumns.date && <td>{row.date}</td>}
                                    {visibleColumns.campaignId && <td>{row.camp_id}</td>}
                                    {visibleColumns.campaignName && <td>{row.campaignName}</td>}
                                    {visibleColumns.goalName && <td>{row.goalName}</td>}
                                    {visibleColumns.publisherId && <td>{row.publisher_id}</td>}
                                    {visibleColumns.publisherName && <td>{row.publisherName}</td>}
                                    {visibleColumns.source && <td style={{ wordBreak: 'break-all' }}>{row.source}</td>}
                                    {visibleColumns.gross_clicks && <td>{row.gross_clicks || 0}</td>}
                                    {visibleColumns.clicks && <td>{row.clicks}</td>}
                                    {visibleColumns.unique_clicks && <td>{row.unique_clicks || 0}</td>}
                                    {visibleColumns.sampled_clicks && <td>{row.sampled_clicks || 0}</td>}
                                    {visibleColumns.gross_conversions && <td>{(row.gross_conversions || 0).toLocaleString()}</td>}
                                    {visibleColumns.sampled_conversions && <td>{(row.sampled_conversions || 0).toLocaleString()}</td>}
                                    {visibleColumns.conversions && <td>{row.conversions}</td>}
                                    {visibleColumns.cr && <td>{row.cr}%</td>}
                                    {visibleColumns.epc && <td>₹{row.epc}</td>}
                                    {visibleColumns.payout && <td>₹{row.payout.toFixed(2)}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {processedData.length > 0 && !loading && (
                        <tfoot>
                            <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                                {visibleColumns.date && <td>TOTAL</td>}
                                {visibleColumns.campaignId && <td>-</td>}
                                {visibleColumns.campaignName && <td>-</td>}
                                {visibleColumns.goalName && <td>-</td>}
                                {visibleColumns.publisherId && <td>-</td>}
                                {visibleColumns.publisherName && <td>-</td>}
                                {visibleColumns.source && <td>-</td>}
                                {visibleColumns.gross_clicks && <td>{totals.gross_clicks.toLocaleString()}</td>}
                                {visibleColumns.clicks && <td>{totals.clicks.toLocaleString()}</td>}
                                {visibleColumns.unique_clicks && <td>{totals.unique_clicks.toLocaleString()}</td>}
                                {visibleColumns.sampled_clicks && <td>{totals.sampled_clicks.toLocaleString()}</td>}
                                {visibleColumns.gross_conversions && <td>{totals.gross_conversions.toLocaleString()}</td>}
                                {visibleColumns.sampled_conversions && <td>{totals.sampled_conversions.toLocaleString()}</td>}
                                {visibleColumns.conversions && <td>{totals.conversions.toLocaleString()}</td>}
                                {visibleColumns.cr && <td>{(totals.clicks > 0 ? (totals.conversions / totals.clicks * 100).toFixed(2) : 0)}%</td>}
                                {visibleColumns.epc && <td>₹{(totals.clicks > 0 ? totals.payout / totals.clicks : 0).toFixed(4)}</td>}
                                {visibleColumns.payout && <td>₹{totals.payout.toFixed(2)}</td>}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default Reports;
