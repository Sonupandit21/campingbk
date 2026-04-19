import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const SuperAdminSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    photo: '',
    role: 'superadmin' // Forced role for this page
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    // Mobile number validation
    if (e.target.name === 'mobile') {
      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, mobile: value });
      return;
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image too large. Please use an image under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, photo: compressedDataUrl });
          setPreview(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container superadmin-theme">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span style={{ color: '#ef4444' }}>⚡</span> Super Admin Registration
          </div>
          <p className="auth-title">Create Master Account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="System Administrator"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@system.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              className="form-input"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Access Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Identification Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-input"
            />
            {preview && <img src={preview} alt="Preview" className="photo-preview" style={{width: '50px', height: '50px', borderRadius: '50%', marginTop: '10px'}} />}
          </div>

          <button type="submit" className="auth-button superadmin-btn" disabled={loading}>
            {loading ? 'Initializing...' : 'Create SuperAdmin'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/superadmin/login" className="auth-link">SuperAdmin Login</Link>
        </div>
      </div>
      
      <style>{`
        .superadmin-theme {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
        }
        .superadmin-theme .auth-card {
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .superadmin-theme .auth-title {
          color: #94a3b8;
        }
        .superadmin-btn {
          background: linear-gradient(to right, #ef4444, #dc2626) !important;
        }
        .superadmin-btn:hover {
          background: linear-gradient(to right, #dc2626, #b91c1c) !important;
        }
      `}</style>
    </div>
  );
};

export default SuperAdminSignup;
