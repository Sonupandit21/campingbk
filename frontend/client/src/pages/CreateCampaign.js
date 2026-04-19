import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateCampaign.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://trackierpanel.com';

const CreateCampaign = ({ onCancel }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    previewUrl: '',
    defaultUrl: '',
    defaultGoalName: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/campaigns`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Campaign created successfully!');
            if (onCancel) onCancel();
            else navigate('/dashboard'); 
        } else {
            const data = await response.json();
            alert('Failed to create campaign: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating campaign:', error);
        alert('An error occurred while creating the campaign.');
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate('/dashboard');
  };

  const urlTokens = [
    '{click_id}', '{camp_id}', '{publisher_id}', '{source}', 
    '{gaid}', '{idfa}', '{app_name}', '{p1}', '{p2}'
  ];

  return (
    <div className="create-campaign-container">
      <div className="create-campaign-header">
        <h1>Create Campaign</h1>
      </div>

      <form className="campaign-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label>Title <span className="required">*</span></label>
          <span className="help-text">Mention the campaign's name</span>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Campaign title"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description (Optional)</label>
          <span className="help-text">Define key performance metrics (KPIs) that are critical for the publisher to provide the campaign, such as CR &gt; 2.8%.</span>
          <div className="rich-text-editor">
            <div className="editor-toolbar">
              <button type="button" className="toolbar-btn">B</button>
              <button type="button" className="toolbar-btn">U</button>
              <button type="button" className="toolbar-btn">I</button>
              <button type="button" className="toolbar-btn">Link</button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="editor-content"
              style={{width: '100%', border: 'none', resize: 'vertical'}}
              rows="6"
            ></textarea>
          </div>

        {/* Default Goal Name */}
        <div className="form-group">
          <label>Default Goal Name</label>
          <input
            type="text"
            name="defaultGoalName"
            value={formData.defaultGoalName}
            onChange={handleChange}
            className="form-input"
            placeholder="Set a name for the default campaign goal, eg: Install"
          />
          <span className="help-text">Set a name for the default campaign goal, eg: Install</span>
        </div>
        </div>

        {/* Default Campaign URL */}
        <div className="form-group">
          <label>Default Campaign URL <span className="required">*</span></label>
          <span className="help-text">Include the tracking URL provided by your advertiser where traffic will redirect to.</span>
          <input
            type="url"
            name="defaultUrl"
            value={formData.defaultUrl}
            onChange={handleChange}
            className="form-input"
            placeholder="https://xyz.domain.com/click/?advertiser_click_macro={click_id}"
            required
          />
          <span className="help-text">Example: https://xyz.domain.com/click/?advertiser_click_macro={'{click_id}'}</span>
          
          <div style={{marginTop: '1rem'}}>
            <label style={{fontSize: '0.875rem', marginBottom: '0.25rem'}}>Most Used URL tokens</label>
            <div className="tokens-container">
              {urlTokens.map(token => (
                <span key={token} className="token-badge" onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    defaultUrl: prev.defaultUrl + token
                  }));
                }}>
                  {token}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" className="btn-primary">Save</button>
          <button type="button" onClick={handleCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
