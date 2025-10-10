import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'sonner'
import apiService from './services/apiService'
import NavBar from './components/NavBar'

export default function MyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const getUserName = () => {
    if (!user) return 'User'
    return user.first_name || user.name?.split(' ')[0] || 'User'
  }

  useEffect(() => {
    // Get user info from localStorage or fetch from API
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if (!token || !userId) {
      setLoading(false)
      return
    }

    const fetchUserAndEvents = async () => {
      try {
        setLoading(true)
        
        // Fetch user profile to get email
        const userProfile = await apiService.getUserProfile()
        setUser(userProfile.user)
        
        // Fetch user's registered events
        const response = await apiService.getMyRegisteredEvents(userProfile.user.email)
        
        if (response.success) {
          setEvents(response.events || [])
        } else {
          setError(response.error || 'Failed to fetch your events')
          toast.error('Failed to load your events')
        }
      } catch (err) {
        console.error('Failed to fetch my events:', err)
        setError('Failed to load your registered events')
        toast.error('Failed to load your events')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndEvents()
  }, [])

  const getEventImage = (event) => {
    const eventType = event.event_type?.toLowerCase() || ''
    const eventName = event.name?.toLowerCase() || ''
    
    if (eventType.includes('workshop') || eventType.includes('seminar')) {
      return 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=400&h=400&fit=crop'
    } else if (eventType.includes('hackathon') || eventType.includes('coding')) {
      return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop'
    } else if (eventType.includes('cultural') || eventType.includes('fest')) {
      return 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop'
    } else if (eventType.includes('sports') || eventType.includes('competition')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop'
    } else if (eventType.includes('tech talk') || eventType.includes('conference')) {
      return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop'
    } else if (eventType.includes('music') || eventType.includes('concert')) {
      return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop'
    }
    
    if (eventName.includes('hackathon')) {
      return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop'
    } else if (eventName.includes('debate') || eventName.includes('speaking')) {
      return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=400&fit=crop'
    }
    
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop'
  }

  const handleCancelRegistration = async (eventId, eventName, e) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      return
    }

    try {
      const email = user.emailAddresses[0].emailAddress
      const response = await apiService.cancelEventRegistration(eventId, email)
      
      if (response.success) {
        setEvents(events.filter(event => event.id !== eventId))
        toast.success('Registration cancelled successfully!')
      } else {
        toast.error(response.error || 'Failed to cancel registration')
      }
    } catch (err) {
      console.error('Error cancelling registration:', err)
      toast.error('Failed to cancel registration')
    }
  }

  if (loading) {
    return (
      <div className="page-root">
        <NavBar activePage="my-events" />
        <main className="events-main">
          <div className="events-container">
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading your registered events...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-root">
      <Toaster position="top-center" richColors />
      <NavBar activePage="my-events" />
      
      <main className="events-main">
        <div className="events-container">
          <div className="my-events-welcome">
            <h2>Welcome back, {getUserName()}! 👋</h2>
            <p>Here are all the events you've registered for. Manage your registrations and stay updated.</p>
            {events.length > 0 && (
              <div className="my-events-stats">
                <div className="my-events-stat">
                  <div className="my-events-stat-value">{events.length}</div>
                  <div className="my-events-stat-label">Registered Events</div>
                </div>
                <div className="my-events-stat">
                  <div className="my-events-stat-value">
                    {events.filter(e => new Date(e.event_date) >= new Date()).length}
                  </div>
                  <div className="my-events-stat-label">Upcoming</div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <svg className="error-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="error-banner-text">{error}</p>
            </div>
          )}

          {!loading && (
            <div className="events-grid-section">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <div 
                    key={event.id} 
                    className="event-card-new my-event-card"
                  >
                    <div className="event-image-wrapper">
                      <img
                        src={getEventImage(event)}
                        alt={event.name}
                        className="event-image"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = '/placeholder-event.png'
                        }}
                      />
                      <div className="event-badge-registered">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Registered
                      </div>
                    </div>

                    <h3 className="event-name-new">{event.name}</h3>
                    <p className="event-club-new">Hosted by {event.club_name}</p>

                    <div className="event-info-grid">
                      <div className="event-info-item-new">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>{apiService.formatEventDate(event.event_date)}, {apiService.formatEventTime(event.start_time)}</span>
                      </div>

                      {event.venue_name && (
                        <div className="event-info-item-new">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>{event.venue_name}</span>
                        </div>
                      )}

                      <div className="event-info-item-new">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span className="event-attendance">
                          {event.registered_count || 0} attending
                        </span>
                      </div>
                    </div>

                    <button 
                      className="cancel-registration-btn"
                      onClick={(e) => handleCancelRegistration(event.id, event.name, e)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      Cancel Registration
                    </button>
                  </div>
                ))
              ) : (
                <div className="no-events-grid">
                  <svg className="no-events-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                  </svg>
                  <p>You haven't registered for any events yet.</p>
                  <a href="/events" className="browse-events-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Browse Events
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
