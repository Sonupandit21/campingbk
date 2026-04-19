import React, { useState, useEffect } from 'react';
import './AddPublisher.css';

const AddPublisher = ({ onCancel, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    status: 'Active',
    country: 'IN',
    company: '',
    referenceId: '',
    advancedSetup: false,
    password: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        status: initialData.status || 'Active',
        country: initialData.country || 'IN',
        company: initialData.company || '',
        referenceId: initialData.referenceId || '',
        postbackUrl: initialData.postbackUrl || '',
        advancedSetup: false,
        password: '' // Don't populate password for security/simplicity
      });
    } else {
        // Reset form for add mode
        setFormData({
            fullName: '',
            email: '',
            status: 'Active',
            country: 'IN',
            company: '',
            referenceId: '',
            postbackUrl: '',
            advancedSetup: false,
            password: ''
        });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleAdvanced = () => {
    setFormData(prev => ({
      ...prev,
      advancedSetup: !prev.advancedSetup
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting publisher:', formData);
    // TODO: content api call
    if (onSave) onSave(formData);
  };

  return (
    <div className="add-publisher-container">
      <div className="add-publisher-header">
        <h2>{initialData ? 'Edit Publisher' : 'Add Publisher'}</h2>
        <a href="#" className="know-more-link">To know more, click here. 🔗</a>
      </div>

      <form className="publisher-form" onSubmit={handleSubmit}>
        <h3 className="form-section-title">Basic Details</h3>

        <div className="form-row">
          <label>Full Name <span className="required">*</span></label>
          <input
            type="text"
            name="fullName"
            className="form-input"
            placeholder="Full name of the publisher"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label>Email <span className="required">*</span></label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Unique Publisher Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <label>Account Status <span className="required">*</span></label>
          <select 
            name="status" 
            className="form-select"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="form-row">
          <label>Country</label>
          <select 
            name="country" 
            className="form-select"
            value={formData.country}
            onChange={handleChange}
          >
            <option value="IN">[IN] India</option>
            <option value="US">[US] United States</option>
            <option value="GB">[GB] United Kingdom</option>
            {/* Add more countries as needed */}
          </select>
        </div>

        <div className="form-row">
          <label>Company (Optional)</label>
          <input
            type="text"
            name="company"
            className="form-input"
            placeholder="Company/Organization name"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <label>Reference ID</label>
          <input
            type="text"
            name="referenceId"
            className="form-input"
            placeholder="Reference ID"
            value={formData.referenceId}
            onChange={handleChange}
          />
        </div>

        <div className="form-row">
          <label>Postback URL</label>
          <input
            type="text"
            name="postbackUrl"
            className="form-input"
            placeholder="http://example.com/postback?clickid={click_id}"
            value={formData.postbackUrl}
            onChange={handleChange}
          />
        </div>

        <div className="toggle-container" onClick={toggleAdvanced}>
          <div className={`toggle-switch ${formData.advancedSetup ? 'active' : ''}`}>
            <div className="toggle-slider"></div>
          </div>
          <span className="toggle-label">Advanced Setup</span>
        </div>

        {formData.advancedSetup && (
           <div className="form-row">
             <label>Password (Optional)</label>
             <input
               type="password"
               name="password"
               className="form-input"
               placeholder="Leave empty to Auto Generate"
               value={formData.password}
               onChange={handleChange}
             />
           </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-submit">{initialData ? 'Update Publisher' : 'Add Publisher'}</button>
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default AddPublisher;
