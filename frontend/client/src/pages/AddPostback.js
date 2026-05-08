import React, { useState, useEffect, useRef } from 'react';
import './PostbackPixels.css';

const AddPostback = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    event: 'CONVERSION',
    publisher: '',
    campaign: 'ALL',
    type: 'Postback URL',
    data: '',
    privacyPostbackUrl: '',
    status: 'Active',
    allowedConversionStatus: ['Approved']
  });

  const [publishers, setPublishers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const dataRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://smarttrackyfly.com';

  useEffect(() => {
    fetchPublishers();
    if (initialData) {
      setFormData(initialData);
      if (initialData.publisher) {
        fetchCampaigns(initialData.publisher);
      }
    }
  }, [initialData]);

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

  const fetchCampaigns = async (publisherId) => {
    if (!publisherId) {
      setCampaigns([]);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/campaigns?publisher_id=${publisherId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const handlePublisherChange = (e) => {
    const pubId = e.target.value;
    setFormData({ ...formData, publisher: pubId, campaign: 'ALL' });
    fetchCampaigns(pubId);
  };

  const insertToken = (token) => {
    const textarea = dataRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.data;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newData = before + token + after;
    
    setFormData({ ...formData, data: newData });
    
    // Set focus back and move cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const toggleConversionStatus = (status) => {
    const current = [...formData.allowedConversionStatus];
    if (current.includes(status)) {
      setFormData({ ...formData, allowedConversionStatus: current.filter(s => s !== status) });
    } else {
      setFormData({ ...formData, allowedConversionStatus: [...current, status] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.data) {
      alert('Data field is required');
      return;
    }
    onSave(formData);
  };

  const tokens = [
    '{p1}', '{p2}', '{click_id}', '{aff_username}', '{publisher_id}', '{ip}', '{country_id}'
  ];

  return (
    <div className="postback-container">
      <div className="form-card">
        <div className="form-header">
          <h2>PostBack: {initialData ? 'Edit' : 'Add'}</h2>
          <a href="#" className="help-link">To know more, click here ↗</a>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Event <span>*</span></label>
              <div className="radio-group">
                {['CONVERSION', 'GOAL', 'CONVERSION + ALL GOALs'].map(evt => (
                  <label key={evt} className="radio-item">
                    <input 
                      type="radio" 
                      name="event" 
                      value={evt} 
                      checked={formData.event === evt}
                      onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                    />
                    {evt}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Publisher <span>*</span></label>
              <select 
                className="form-control" 
                value={formData.publisher} 
                onChange={handlePublisherChange}
                required
              >
                <option value="">Select a Publisher</option>
                {publishers.map(pub => (
                  <option key={pub.id} value={pub.id}>{pub.fullName} ({pub.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Campaigns</label>
              <select 
                className="form-control" 
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              >
                <option value="ALL">ALL</option>
                {campaigns.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.title} ({camp.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Type <span>*</span></label>
              <select 
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Postback URL">Postback URL</option>
                <option value="Image Pixel">Image Pixel</option>
                <option value="JS Pixel">JS Pixel</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select 
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Data <span>*</span></label>
              <div className="textarea-container">
                <textarea 
                  ref={dataRef}
                  className="form-control" 
                  rows="4" 
                  placeholder="Enter URL or Pixel code"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                ></textarea>
                <div className="token-chips">
                  {tokens.map(token => (
                    <span 
                      key={token} 
                      className="token-chip"
                      onClick={() => insertToken(token)}
                    >
                      {token}
                    </span>
                  ))}
                  <span className="see-more">See more tokens</span>
                </div>
              </div>
            </div>

            <div className="form-group full-width">
              <label>Allowed Conversion Status</label>
              <div className="multi-select-tags">
                {['Approved', 'Pending', 'Cancelled', 'Rejected'].map(status => (
                  <div 
                    key={status} 
                    className={`tag-item ${formData.allowedConversionStatus.includes(status) ? '' : 'inactive'}`}
                    onClick={() => toggleConversionStatus(status)}
                  >
                    {formData.allowedConversionStatus.includes(status) ? '✓ ' : '+ '}
                    {status}
                  </div>
                ))}
              </div>
              <p className="helper-text">Postback is fired only once for a conversion</p>
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-submit">{initialData ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPostback;
