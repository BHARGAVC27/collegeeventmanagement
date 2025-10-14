import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function NavBar({ activePage = '' }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    // Clear the JWT token from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    // Redirect to home page
    navigate('/')
  }

  // Check if user is club head
  const isClubHead = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userType = localStorage.getItem('userType')
    return userType === 'student' && user.role?.includes('club_head')
  }

  return (
    <nav className="dashboard-nav">
      <div className="nav-left">
        <div 
          className="logo-btn" 
          onClick={() => navigate('/dashboard')} 
          style={{ cursor: 'pointer' }}
        >
          Logo
        </div>
      </div>
      <div className="nav-center">
        <button 
          className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-btn ${activePage === 'events' ? 'active' : ''}`} 
          onClick={() => navigate('/events')}
        >
          Events
        </button>
        <button 
          className={`nav-btn ${activePage === 'clubs' ? 'active' : ''}`} 
          onClick={() => navigate('/clubs')}
        >
          Clubs
        </button>
        <button 
          className={`nav-btn ${activePage === 'my-events' ? 'active' : ''}`} 
          onClick={() => navigate('/my-events')}
        >
          My Events
        </button>
        
        {/* Show Create Event button only for club heads */}
        {isClubHead() && (
          <button 
            className={`nav-btn create-event-btn ${activePage === 'create-event' ? 'active' : ''}`} 
            onClick={() => navigate('/create-event')}
          >
            Create Event
          </button>
        )}
        
      </div>
      <div className="nav-right">
        <div className="profile-btn-wrapper">
          <button 
            onClick={handleLogout}
            className="logout-btn"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--primary-text)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent'
            }}
          >
            Logout
          </button>
          <span className="profile-text">Profile</span>
        </div>
      </div>
    </nav>
  )
}
