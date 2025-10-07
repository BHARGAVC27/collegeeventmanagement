import React from 'react'
import { useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'

export default function NavBar({ activePage = '' }) {
  const navigate = useNavigate()

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
        
      </div>
      <div className="nav-right">
        <div className="profile-btn-wrapper">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-white",
                userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-100"
              }
            }}
            afterSignOutUrl="/"
          />
          <span className="profile-text">Profile</span>
        </div>
      </div>
    </nav>
  )
}
