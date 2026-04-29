import React, { useState, useEffect } from 'react';
import AddSamplingModal from '../components/AddSamplingModal';
import AddClicksModal from '../components/AddClicksModal';
import AddPayoutModal from '../components/AddPayoutModal';
import './CampaignDetails.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const CampaignDetails = ({ campaign, onBack, onUpdate }) => {
    // ... (logic remains same)
    const [publishers, setPublishers] = useState([]);
    const [assignedPublishers, setAssignedPublishers] = useState(campaign.assignedPublishers || []);
    const [pendingSearch, setPendingSearch] = useState('');
    const [approvedSearch, setApprovedSearch] = useState('');
    
    // Tracking Link State
    const [publisherListType, setPublisherListType] = useState('assigned');
    const [selectedPublisher, setSelectedPublisher] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [macros, setMacros] = useState({
        tracking_source: false,
        source: false,
        change_tracking_domain: false,
        deeplink: false,
        google_ads_link: false,
        generate_short_link: false,
        gaid: false
    });

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: campaign.title,
        status: campaign.status,
        defaultUrl: campaign.defaultUrl,
        previewUrl: campaign.previewUrl || ''
    });

    useEffect(() => {
        setEditData({
            title: campaign.title,
            status: campaign.status,
            defaultUrl: campaign.defaultUrl,
            previewUrl: campaign.previewUrl || ''
        });
    }, [campaign]);

    const handleSaveDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });
            
            if (response.ok) {
                setIsEditing(false);
                if (onUpdate) onUpdate();
            } else {
                alert('Failed to update campaign');
            }
        } catch (error) {
            console.error('Update failed:', error);
            alert('Error updating campaign');
        }
    };

    useEffect(() => {
        fetchPublishers();
    }, []);

    const fetchPublishers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/publishers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPublishers(data);
            }
        } catch (error) {
            console.error('Failed to fetch publishers:', error);
        }
    };

    // Filter publishers for the lists
    const availablePublishers = publishers.filter(p => !assignedPublishers.some(id => String(id) === String(p.id)));
    
    const filteredPending = availablePublishers.filter(p => 
        p.fullName.toLowerCase().includes(pendingSearch.toLowerCase()) || 
        p.id.toString().includes(pendingSearch)
    );

    const filteredApproved = publishers.filter(p => assignedPublishers.some(id => String(id) === String(p.id))).filter(p => 
        p.fullName.toLowerCase().includes(approvedSearch.toLowerCase()) ||
        p.id.toString().includes(approvedSearch)
    );

    const handleAssign = (pubId) => {
        const newAssigned = [...assignedPublishers, pubId];
        setAssignedPublishers(newAssigned);
        savePermissions(newAssigned);
    };

    const handleUnassign = (pubId) => {
        const newAssigned = assignedPublishers.filter(id => String(id) !== String(pubId));
        setAssignedPublishers(newAssigned);
        savePermissions(newAssigned);
    };

    const savePermissions = async (newAssigned) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ assignedPublishers: newAssigned })
            });
            if (response.ok) {
                // Optional: show toast
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Failed to save permissions:', error);
        }
    };

    // Sampling Logic
    const [isSamplingModalOpen, setIsSamplingModalOpen] = useState(false);
    const [editingSamplingIndex, setEditingSamplingIndex] = useState(null);

    const handleSaveSampling = async (rule) => {
        let updatedSampling;
        const currentSampling = campaign.sampling || [];
        
        if (editingSamplingIndex !== null) {
            updatedSampling = [...currentSampling];
            updatedSampling[editingSamplingIndex] = rule;
        } else {
            updatedSampling = [...currentSampling, rule];
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sampling: updatedSampling })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
                setIsSamplingModalOpen(false);
                setEditingSamplingIndex(null);
            } else {
                alert('Failed to save sampling rule');
            }
        } catch (error) {
            console.error('Error saving sampling:', error);
            alert('Error saving sampling rule');
        }
    };

    const handleDeleteSampling = async (index) => {
        if (!window.confirm('Are you sure you want to delete this sampling rule?')) return;

        const currentSampling = campaign.sampling || [];
        const updatedSampling = currentSampling.filter((_, i) => i !== index);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sampling: updatedSampling })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
            } else {
                alert('Failed to delete sampling rule');
            }
        } catch (error) {
            console.error('Error deleting sampling:', error);
            alert('Error deleting sampling rule');
        }
    };

    const openAddSampling = () => {
        setEditingSamplingIndex(null);
        setIsSamplingModalOpen(true);
    };

    const openEditSampling = (index) => {
        setEditingSamplingIndex(index);
        setIsSamplingModalOpen(true);
    };

    // Clicks Logic
    const [isClicksModalOpen, setIsClicksModalOpen] = useState(false);
    const [editingClicksIndex, setEditingClicksIndex] = useState(null);

    const handleSaveClicks = async (rule) => {
        let updatedClicks;
        const currentClicks = campaign.clicksSettings || [];
        
        if (editingClicksIndex !== null) {
            updatedClicks = [...currentClicks];
            updatedClicks[editingClicksIndex] = rule;
        } else {
            updatedClicks = [...currentClicks, rule];
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ clicksSettings: updatedClicks })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
                setIsClicksModalOpen(false);
                setEditingClicksIndex(null);
            } else {
                alert('Failed to save clicks rule');
            }
        } catch (error) {
            console.error('Error saving clicks:', error);
            alert('Error saving clicks rule');
        }
    };

    const handleDeleteClicks = async (index) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;

        const currentClicks = campaign.clicksSettings || [];
        const updatedClicks = currentClicks.filter((_, i) => i !== index);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ clicksSettings: updatedClicks })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
            } else {
                alert('Failed to delete clicks rule');
            }
        } catch (error) {
            console.error('Error deleting clicks rule:', error);
            alert('Error deleting clicks rule');
        }
    };

    const openAddClicks = () => {
        setEditingClicksIndex(null);
        setIsClicksModalOpen(true);
    };

    const openEditClicks = (index) => {
        setEditingClicksIndex(index);
        setIsClicksModalOpen(true);
    };

    // Payouts Logic
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [editingPayoutIndex, setEditingPayoutIndex] = useState(null);

    const handleSavePayout = async (rule) => {
        let updatedPayouts;
        const currentPayouts = campaign.payouts || [];
        
        if (editingPayoutIndex !== null) {
            updatedPayouts = [...currentPayouts];
            updatedPayouts[editingPayoutIndex] = rule;
        } else {
            updatedPayouts = [...currentPayouts, rule];
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payouts: updatedPayouts })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
                setIsPayoutModalOpen(false);
                setEditingPayoutIndex(null);
            } else {
                alert('Failed to save payout rule');
            }
        } catch (error) {
            console.error('Error saving payout:', error);
            alert('Error saving payout rule');
        }
    };

    const handleDeletePayout = async (index) => {
        if (!window.confirm('Are you sure you want to delete this payout rule?')) return;

        const currentPayouts = campaign.payouts || [];
        const updatedPayouts = currentPayouts.filter((_, i) => i !== index);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BACKEND_URL}/api/campaigns/${campaign.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ payouts: updatedPayouts })
            });

            if (response.ok) {
                if (onUpdate) onUpdate();
            } else {
                alert('Failed to delete payout rule');
            }
        } catch (error) {
            console.error('Error deleting payout:', error);
            alert('Error deleting payout rule');
        }
    };

    const openAddPayout = () => {
        setEditingPayoutIndex(null);
        setIsPayoutModalOpen(true);
    };

    const openEditPayout = (index) => {
        setEditingPayoutIndex(index);
        setIsPayoutModalOpen(true);
    };

    // Tracking Link Logic
    useEffect(() => {
        if (!selectedPublisher) {
            setGeneratedLink('');
            return;
        }

        const isPending = !assignedPublishers.some(id => String(id) === String(selectedPublisher));
        if (isPending) {
            setGeneratedLink('INSUFFICIENT_PERMISSION');
            return;
        }

        const pub = publishers.find(p => p.id == selectedPublisher);
        
        // Base Tracking URL
        const trackingBase = `${BACKEND_URL}/api/track`;
        let trackingParams = [`camp_id=${campaign.id}`];
        
        if (pub) trackingParams.push(`publisher_id=${pub.id}`);
        
        // Macros
        if (macros.tracking_source) trackingParams.push(`click_id={click_id}`);
        if (macros.source) trackingParams.push(`source_id={source_id}`);
        if (macros.gaid) trackingParams.push(`gaid={gaid}`);
        if (macros.deeplink) trackingParams.push(`deeplink=true`);

        setGeneratedLink(`${trackingBase}?${trackingParams.join('&')}`);
        
    }, [selectedPublisher, macros, campaign, publishers, assignedPublishers]);


    return (
        <div className="campaign-details-container">
            <div className="back-nav" onClick={onBack}>
                <span>←</span> Back to Campaigns
            </div>

            <div className="details-grid">
                {/* Left Column: Details */}
                <div className="card">
                    <div className="card-header">
                        <h3>Details (ID: {campaign.id})</h3>
                        <div className="actions">
                            {!isEditing ? (
                                <button className="btn-secondary" onClick={() => setIsEditing(true)}>Edit</button>
                            ) : (
                                <div style={{display: 'flex', gap: '5px'}}>
                                    <button className="btn-primary" onClick={handleSaveDetails}>Save</button>
                                    <button className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="details-content">
                        <div className="detail-row">
                            <span className="label">Title</span>
                            {isEditing ? (
                                <input className="form-input" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                            ) : (
                                <span className="value">{campaign.title}</span>
                            )}
                        </div>
                        <div className="detail-row">
                            <span className="label">Objective</span>
                            <span className="value">conversions (CPI)</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Status</span>
                            {isEditing ? (
                                <select className="form-select" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                                    <option value="Active">Active</option>
                                    <option value="Paused">Paused</option>
                                    <option value="Stopped">Stopped</option>
                                </select>
                            ) : (
                                <span className="value">
                                    <span className={`badge ${campaign.status === 'Active' ? 'green' : 'gray'}`}>{campaign.status}</span>
                                </span>
                            )}
                        </div>
                        <div className="detail-row">
                            <span className="label">URL</span>
                            {isEditing ? (
                                <textarea className="form-input" value={editData.defaultUrl} onChange={e => setEditData({...editData, defaultUrl: e.target.value})} rows="3" />
                            ) : (
                                <span className="value">{campaign.defaultUrl}</span>
                            )}
                        </div>
                        <div className="detail-row">
                            <span className="label">Preview URL</span>
                            {isEditing ? (
                                <input className="form-input" value={editData.previewUrl} onChange={e => setEditData({...editData, previewUrl: e.target.value})} />
                            ) : (
                                <span className="value">{campaign.previewUrl || '-'}</span>
                            )}
                        </div>
                        <div className="detail-row">
                            <span className="label">Created At</span>
                            <span className="value">{new Date(campaign.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tracking Link */}
                <div className="card">
                    <div className="card-header">
                        <h3>Tracking Link</h3>
                        <button className="btn-primary">Manage Links</button>
                    </div>
                    <div className="tracking-content">
                        <div className="radio-group" style={{marginBottom: '1rem'}}>
                            <label><input type="radio" checked={publisherListType === 'assigned'} onChange={() => {setPublisherListType('assigned'); setSelectedPublisher('');}} /> Assigned Publishers</label>
                            <label style={{color: '#94a3b8'}}><input type="radio" checked={publisherListType === 'unassigned'} onChange={() => {setPublisherListType('unassigned'); setSelectedPublisher('');}} /> Unassigned Publishers</label>
                        </div>
                        
                        <div className="form-group">
                            <select 
                                className="form-select" 
                                value={selectedPublisher}
                                onChange={(e) => setSelectedPublisher(e.target.value)}
                                disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))}
                            >
                                <option value="">Choose any publisher to Generate its tracking Link</option>
                                {(publisherListType === 'assigned' ? filteredApproved : availablePublishers).map(pub => (
                                    <option key={pub.id} value={pub.id}>{pub.fullName} (ID: {pub.id})</option>
                                ))}
                                {selectedPublisher && !(publisherListType === 'assigned' ? filteredApproved : availablePublishers).some(p => String(p.id) === String(selectedPublisher)) && publishers.find(p => String(p.id) === String(selectedPublisher)) && (
                                    <option value={selectedPublisher} style={{display: 'none'}}>
                                        {publishers.find(p => String(p.id) === String(selectedPublisher))?.fullName} (ID: {selectedPublisher})
                                    </option>
                                )}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Generated Link</label>
                            <textarea 
                                className="form-input" 
                                readOnly 
                                value={generatedLink}
                                disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))}
                                style={{
                                    height: '80px', 
                                    color: (selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))) ? '#ef4444' : '#334155', 
                                    background: '#f8fafc',
                                    fontWeight: (selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))) ? 'bold' : 'normal'
                                }}
                            />
                        </div>

                        <div className="macros-grid">
                            <label><input type="checkbox" disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))} checked={macros.tracking_source} onChange={(e) => setMacros({...macros, tracking_source: e.target.checked})}/> Add Tracking Source</label>
                            <label><input type="checkbox" disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))} checked={macros.source} onChange={(e) => setMacros({...macros, source: e.target.checked})}/> Add Source (Sub Publisher)</label>
                            <label><input type="checkbox" disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))} checked={macros.deeplink} onChange={(e) => setMacros({...macros, deeplink: e.target.checked})}/> Add DeepLink</label>
                            <label><input type="checkbox" disabled={selectedPublisher && !assignedPublishers.some(id => String(id) === String(selectedPublisher))} checked={macros.gaid} onChange={(e) => setMacros({...macros, gaid: e.target.checked})}/> Add GAID</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sampling Section */}
            <div className="card" style={{marginTop: '2rem'}}>
                <div className="card-header" style={{display: 'flex', justifyContent: 'center', position: 'relative'}}>
                    <h3 style={{position: 'absolute', left: 0}}>Sampling / Cutoff</h3>
                    <button className="btn-primary" onClick={openAddSampling}>+ Add Cutoff/Sampling</button>
                </div>
                
                <div className="table-responsive">
                    <table className="data-table" style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
                        <thead>
                            <tr style={{background: '#f8fafc',  textAlign: 'left', color: '#334155'}}>
                                <th style={{padding: '0.75rem'}}>SBO ⓘ</th>
                                <th style={{padding: '0.75rem'}}>Publisher</th>
                                <th style={{padding: '0.75rem'}}>SBOV ⓘ</th>
                                <th style={{padding: '0.75rem'}}>Goal</th>
                                <th style={{padding: '0.75rem'}}>Value</th>
                                <th style={{padding: '0.75rem'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(campaign.sampling && campaign.sampling.length > 0) ? (
                                campaign.sampling.map((rule, index) => (
                                    <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={{padding: '0.75rem'}}>{rule.samplingBasedOn}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.publisherName}</td>
                                        <td style={{padding: '0.75rem'}}>
                                            {rule.subIdsType === 'All' ? 'All' : 
                                             rule.subIdsType === 'Exclude' ? `Exclude: ${rule.subIds.join(',')}` : 
                                             `Include: ${rule.subIds.join(',')}`}
                                        </td>
                                        <td style={{padding: '0.75rem'}}>{rule.goalName || 'Gross Conversions'}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.samplingValue}%</td>
                                        <td style={{padding: '0.75rem'}}>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => openEditSampling(index)}
                                                style={{marginRight: '10px', color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => handleDeleteSampling(index)}
                                                style={{color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>
                                        No sampling rules added
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddSamplingModal 
                isOpen={isSamplingModalOpen}
                onClose={() => setIsSamplingModalOpen(false)}
                onSave={handleSaveSampling}
                publishers={publishers}
                initialData={editingSamplingIndex !== null ? campaign.sampling[editingSamplingIndex] : null}
            />

            {/* Clicks / Unique Clicks Section */}
            <div className="card" style={{marginTop: '2rem'}}>
                <div className="card-header" style={{display: 'flex', justifyContent: 'center', position: 'relative'}}>
                    <h3 style={{position: 'absolute', left: 0}}>Clicks / Unique Clicks</h3>
                    <button className="btn-primary" onClick={openAddClicks}>+ Add Clicks Config</button>
                </div>
                
                <div className="table-responsive">
                    <table className="data-table" style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
                        <thead>
                            <tr style={{background: '#f8fafc',  textAlign: 'left', color: '#334155'}}>
                                <th style={{padding: '0.75rem'}}>Type</th>
                                <th style={{padding: '0.75rem'}}>Publisher</th>
                                <th style={{padding: '0.75rem'}}>Based On</th>
                                <th style={{padding: '0.75rem'}}>Sub IDs</th>
                                <th style={{padding: '0.75rem'}}>Cutoff</th>
                                <th style={{padding: '0.75rem'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(campaign.clicksSettings && campaign.clicksSettings.length > 0) ? (
                                campaign.clicksSettings.map((rule, index) => (
                                    <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={{padding: '0.75rem'}}>{rule.type}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.publisherName}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.basedOn}</td>
                                        <td style={{padding: '0.75rem'}}>
                                            {rule.subIdsType === 'All' ? 'All' : 
                                             rule.subIdsType === 'Exclude' ? `Exclude: ${rule.subIds.join(',')}` : 
                                             `Include: ${rule.subIds.join(',')}`}
                                        </td>
                                        <td style={{padding: '0.75rem'}}>
                                            {rule.value}{rule.cutoffType === 'percentage' ? '%' : ''}
                                        </td>
                                        <td style={{padding: '0.75rem'}}>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => openEditClicks(index)}
                                                style={{marginRight: '10px', color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => handleDeleteClicks(index)}
                                                style={{color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>
                                        No clicks settings added
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddClicksModal 
                isOpen={isClicksModalOpen}
                onClose={() => setIsClicksModalOpen(false)}
                onSave={handleSaveClicks}
                publishers={publishers}
                initialData={editingClicksIndex !== null ? campaign.clicksSettings[editingClicksIndex] : null}
            />

            {/* Payouts Section */}
            <div className="card" style={{marginTop: '2rem'}}>
                <div className="card-header" style={{display: 'flex', justifyContent: 'center', position: 'relative'}}>
                    <h3 style={{position: 'absolute', left: 0}}>Payouts</h3>
                    <button className="btn-primary" onClick={openAddPayout}>+ Add Payout</button>
                </div>
                
                <div className="table-responsive">
                    <table className="data-table" style={{width: '100%', borderCollapse: 'collapse', marginTop: '1rem'}}>
                        <thead>
                            <tr style={{background: '#f8fafc',  textAlign: 'left', color: '#334155'}}>
                                <th style={{padding: '0.75rem'}}>Goal</th>
                                <th style={{padding: '0.75rem'}}>Publisher</th>
                                <th style={{padding: '0.75rem'}}>Type</th>
                                <th style={{padding: '0.75rem'}}>Value</th>
                                <th style={{padding: '0.75rem'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(campaign.payouts && campaign.payouts.length > 0) ? (
                                campaign.payouts.map((rule, index) => (
                                    <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                                        <td style={{padding: '0.75rem'}}>{rule.goalName}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.publisherName}</td>
                                        <td style={{padding: '0.75rem'}}>{rule.payoutType === 'fixed' ? 'Fixed' : 'Percentage'}</td>
                                        <td style={{padding: '0.75rem'}}>
                                            {rule.payoutType === 'percentage' ? `${rule.payoutValue}%` : `₹${rule.payoutValue}`}
                                        </td>
                                        <td style={{padding: '0.75rem'}}>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => openEditPayout(index)}
                                                style={{marginRight: '10px', color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="btn-text" 
                                                onClick={() => handleDeletePayout(index)}
                                                style={{color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none'}}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{padding: '2rem', textAlign: 'center', color: '#94a3b8'}}>
                                        No payout rules added
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddPayoutModal 
                isOpen={isPayoutModalOpen}
                onClose={() => setIsPayoutModalOpen(false)}
                onSave={handleSavePayout}
                publishers={publishers}
                initialData={editingPayoutIndex !== null ? campaign.payouts[editingPayoutIndex] : null}
            />

            {/* Bottom Row: Publisher Access */}
            <div className="card" style={{marginTop: '2rem'}}>
                <div className="card-header">
                    <h3>Publisher Access</h3>
                    <button className="btn-primary" onClick={() => savePermissions(assignedPublishers)}>Save</button>
                </div>
                
                <div className="permissions-container">
                    {/* Pending / Available List */}
                    <div className="list-box">
                        <div style={{marginBottom: '0.5rem', fontWeight: 600}}>Pending (Available)</div>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="search..." 
                            value={pendingSearch}
                            onChange={(e) => setPendingSearch(e.target.value)}
                            style={{marginBottom: '0.5rem'}}
                        />
                        <div className="scroll-list" style={{height: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px'}}>
                            {filteredPending.map(pub => (
                                <div 
                                    key={pub.id} 
                                    onClick={() => handleAssign(pub.id)}
                                    className="list-item" 
                                    style={{padding: '0.5rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', gap: '10px'}}
                                >
                                    <span>[ID: {pub.id}]</span>
                                    <span>{pub.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Arrows */}
                    <div className="arrows" style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingTop: '100px', color: '#64748b'}}>
                        ⇄
                    </div>

                    {/* Approved List */}
                    <div className="list-box">
                        <div style={{marginBottom: '0.5rem', fontWeight: 600}}>Approved</div>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="search..." 
                            value={approvedSearch}
                            onChange={(e) => setApprovedSearch(e.target.value)}
                            style={{marginBottom: '0.5rem'}}
                        />
                        <div className="scroll-list" style={{height: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px'}}>
                            {filteredApproved.map(pub => (
                                <div 
                                    key={pub.id}
                                    onClick={() => handleUnassign(pub.id)} 
                                    className="list-item approved"
                                    style={{padding: '0.5rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: '#f0f9ff', display: 'flex', gap: '10px'}}
                                >
                                    <span>[ID: {pub.id}]</span>
                                    <span>{pub.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetails;
