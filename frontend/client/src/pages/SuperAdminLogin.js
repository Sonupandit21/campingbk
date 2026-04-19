import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const SuperAdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(formData);
      if (data.user.role !== 'superadmin') {
         // If logged in but not superadmin, we still log them in but maybe they shouldn't use this form?
         // Actually, let's just let them in if they are superadmin, or redirect if they are admin.
         if (data.user.role === 'admin' || data.user.role === 'user') {
             navigate('/dashboard');
             return;
         }
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container superadmin-theme">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span style={{ color: '#ef4444' }}>⚡</span> Super Admin Control
          </div>
          <p className="auth-title">Restricted Access</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">SuperAdmin Email</label>
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
            <label className="form-label">Secure Password</label>
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

          <button type="submit" className="auth-button superadmin-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Initialize Session'}
          </button>
        </form>

        <div className="auth-footer">
          Centralized Campaign Management System v2.0
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

export default SuperAdminLogin;
