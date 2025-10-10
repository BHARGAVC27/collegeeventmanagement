import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from './services/apiService';
import './AdminLogin.css';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiService.adminLogin(formData);

      if (data.success) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userType', 'admin');

        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 4.5C14.7 4.4 14.3 4.4 14 4.5L12 5.3L10 4.5C9.7 4.4 9.3 4.4 9 4.5L3 7V9H21ZM12 7L15 8.2V20H9V8.2L12 7Z" fill="currentColor"/>
            </svg>
          </div>
          <h1>Admin Portal</h1>
          <p>Faculty & Administrative Access</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@university.edu"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className={`admin-login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In to Admin Panel'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <div className="divider">
            <span>or</span>
          </div>
          <button 
            className="student-portal-btn"
            onClick={() => navigate('/login')}
            type="button"
          >
            Go to Student Portal
          </button>
          
          <div className="admin-note">
            <p>This portal is restricted to authorized faculty and administrative staff only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}