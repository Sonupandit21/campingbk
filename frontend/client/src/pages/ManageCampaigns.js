import React, { useState, useEffect } from 'react';

import CampaignDetails from './CampaignDetails';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');

const ManageCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState(null);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = BACKEND_URL ? `${BACKEND_URL}/api/campaigns` : '/api/campaigns';
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data);
                
                if (selectedCampaign) {
                    const updated = data.find(c => c.id === selectedCampaign.id);
                    if (updated) setSelectedCampaign(updated);
                }
            }
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteCampaign = async (id) => {
        if (window.confirm('Are you sure you want to delete this campaign?')) {
            try {
                const token = localStorage.getItem('token');
                const url = BACKEND_URL ? `${BACKEND_URL}/api/campaigns/${id}` : `/api/campaigns/${id}`;
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    setCampaigns(campaigns.filter(c => c.id !== id));
                } else {
                    alert('Failed to delete campaign');
                }
            } catch (error) {
                console.error('Error deleting campaign:', error);
                alert('Error deleting campaign');
            }
        }
    };

    const approvePublisher = async (campaignId, publisherId) => {
        try {
            const token = localStorage.getItem('token');
            const url = BACKEND_URL ? `${BACKEND_URL}/api/admin/campaigns/${campaignId}/approve/${publisherId}` : `/api/admin/campaigns/${campaignId}/approve/${publisherId}`;
            console.log('Sending approve request:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Publisher approved successfully!');
                window.location.reload(); // Force reload to ensure everything is in sync
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`Approve failed: ${errData.error || response.statusText}`);
            }
        } catch (err) {
            console.error('Approve error:', err);
            alert('Approve error: ' + err.message);
        }
    };

    const rejectPublisher = async (campaignId, publisherId) => {
        try {
            const token = localStorage.getItem('token');
            const url = BACKEND_URL ? `${BACKEND_URL}/api/admin/campaigns/${campaignId}/reject/${publisherId}` : `/api/admin/campaigns/${campaignId}/reject/${publisherId}`;
            console.log('Sending reject request:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Publisher rejected successfully!');
                window.location.reload();
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`Reject failed: ${errData.error || response.statusText}`);
            }
        } catch (err) {
            console.error('Reject error:', err);
            alert('Reject error: ' + err.message);
        }
    };

    if (selectedCampaign) {
        return (
            <CampaignDetails 
                campaign={selectedCampaign} 
                onBack={() => {
                    setSelectedCampaign(null);
                }}
                onUpdate={fetchCampaigns}
            />
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3>All Campaigns</h3>
                <span className="subtitle">View and manage your campaigns</span>
            </div>
            <div className="table-responsive">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Default URL</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {campaigns.length > 0 ? (
                            campaigns.map(camp => (
                                <tr key={camp.id}>
                                    <td>{camp.id}</td>
                                    <td>
                                        <div 
                                            onClick={() => setSelectedCampaign(camp)}
                                            style={{fontWeight: 600, color: '#334155', cursor: 'pointer', textDecoration: 'underline'}}
                                        >
                                            {camp.title}
                                        </div>
                                        <div style={{fontSize: '0.85rem', color: '#64748b'}}>{camp.previewUrl}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${camp.status === 'Active' ? 'green' : 'gray'}`}>
                                            {camp.status}
                                        </span>
                                    </td>
                                    <td>{new Date(camp.createdAt).toLocaleDateString()}</td>
                                    <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                        <a href={camp.defaultUrl} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6'}}>
                                            {camp.defaultUrl}
                                        </a>
                                    </td>
                                    <td>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteCampaign(camp.id); }}
                                            style={{
                                                border: 'none', 
                                                background: '#fee2e2', 
                                                color: '#ef4444', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                marginBottom: '5px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                        
                                        {(() => {
                                            const allPubs = new Map();
                                            // Add from publisherApprovals
                                            camp.publisherApprovals?.forEach(a => {
                                                allPubs.set(String(a.publisher), { id: a.publisher, status: a.status });
                                            });
                                            // Add from assignedPublishers (legacy) as approved if not already present
                                            camp.assignedPublishers?.forEach(id => {
                                                if (!allPubs.has(String(id))) {
                                                    allPubs.set(String(id), { id: id, status: 'approved' });
                                                }
                                            });

                                            return Array.from(allPubs.values()).map(a => (
                                                <div key={a.id} style={{ display: 'flex', gap: '5px', marginTop: '5px', alignItems: 'center', background: '#f8fafc', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>Pub ID: {a.id}</span>
                                                        <span style={{ fontSize: '0.65rem', color: a.status === 'approved' ? '#166534' : a.status === 'rejected' ? '#991b1b' : '#7e22ce', fontWeight: 600 }}>
                                                            {a.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                                                        {a.status !== 'approved' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); approvePublisher(camp.id, a.id); }} 
                                                                style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {a.status !== 'rejected' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); rejectPublisher(camp.id, a.id); }} 
                                                                style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}
                                                            >
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ));
                                        })()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center" style={{padding: '3rem', color: '#94a3b8'}}>
                                    No campaigns found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageCampaigns;
