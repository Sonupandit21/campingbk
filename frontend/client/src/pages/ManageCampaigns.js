import React, { useState, useEffect } from 'react';

import CampaignDetails from './CampaignDetails';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

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
            const response = await fetch(`${BACKEND_URL}/api/campaigns`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCampaigns(data);
                
                // Update selectedCampaign if it exists to reflect changes
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
                const response = await fetch(`${BACKEND_URL}/api/campaigns/${id}`, {
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
                                                fontWeight: 600
                                            }}
                                        >
                                            Delete
                                        </button>
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
