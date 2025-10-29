import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/apiService'
import './Auth.css'

export default function RegisterPage() {
  console.log('RegisterPage rendering');
  
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    branch: '',
    year_of_study: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const branches = [
    'Computer Science',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electronics and Communication',
    'Information Technology',
    'Chemical Engineering',
    'Biotechnology'
  ];

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const data = await apiService.studentRegister({
        student_id: formData.student_id,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        branch: formData.branch,
        year_of_study: parseInt(formData.year_of_study)
      });

      if (data.success) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userType', 'student');

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-root">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Join EventNexus</h1>
          <p>Create your account to get started</p>
        </div>
        <div className="custom-auth-wrapper">
          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="student_id">Student ID</label>
                <input
                  type="text"
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleChange}
                  required
                  placeholder="PES2UG23CS999"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Govinda"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="srn@pesu.pes.edu"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 6 characters"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9981309456"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="year_of_study">Year of Study</label>
                <select
                  id="year_of_study"
                  name="year_of_study"
                  value={formData.year_of_study}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="branch">Branch/Department</label>
              <select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select Branch</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className={`register-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <a href="/login">Sign in here</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}