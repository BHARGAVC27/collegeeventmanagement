import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function EventsPage() {
  console.log('EventsPage rendering');
  
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user's name with fallbacks
  // Get event image based on event type or name
  const getEventImage = (event) => {
    const eventType = event.event_type?.toLowerCase() || '';
    const eventName = event.name?.toLowerCase() || '';
    
    // Match by event type
    if (eventType.includes('workshop') || eventType.includes('seminar')) {
      return 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=400&h=400&fit=crop';
    } else if (eventType.includes('hackathon') || eventType.includes('coding')) {
      return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop';
    } else if (eventType.includes('cultural') || eventType.includes('fest')) {
      return 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=400&fit=crop';
    } else if (eventType.includes('sports') || eventType.includes('competition')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop';
    } else if (eventType.includes('tech talk') || eventType.includes('conference')) {
      return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop';
    } else if (eventType.includes('music') || eventType.includes('concert')) {
      return 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop';
    }
    
    // Match by event name keywords
    if (eventName.includes('hackathon')) {
      return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop';
    } else if (eventName.includes('debate') || eventName.includes('speaking')) {
      return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=400&fit=crop';
    } else if (eventName.includes('art') || eventName.includes('exhibition')) {
      return 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=400&fit=crop';
    } else if (eventName.includes('photo') || eventName.includes('photography')) {
      return 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop';
    }
    
    // Default event image
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=400&fit=crop';
  };

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiService.getEvents();
        if (response.success) {
          setEvents(response.events);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <NavBar activePage="events" />

      {/* Main Content */}
      <main className="events-main">
        <div className="welcome-section">
          <h1 className="welcome-title">Upcoming Events</h1>
          <p className="welcome-subtitle">Take a look at what's happening in campus</p>
        </div>

        <div className="events-grid-section">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="events-grid">
              {events.length > 0 ? (
                events.map((event) => (
                  <div 
                    key={event.id} 
                    className="event-card-new"
                    onClick={() => navigate(`/events/${event.id}/register`)}
                  >
                    <div className="event-image-wrapper">
                      <img
                        src={getEventImage(event)}
                        alt={event.name}
                        className="event-image"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234a5568" width="400" height="400"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + event.name + '%3C/text%3E%3C/svg%3E'
                        }}
                      />
                      {event.max_participants && event.registered_count >= event.max_participants && (
                        <div className="event-badge-full">FULL</div>
                      )}
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
                          Hosted by {event.club_name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events-grid">
                  <p>No upcoming events found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}