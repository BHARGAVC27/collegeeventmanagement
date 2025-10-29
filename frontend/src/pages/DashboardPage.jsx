import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/apiService'
import NavBar from '../components/NavBar'

export default function DashboardPage() {
  console.log('DashboardPage rendering');
  
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clubId, setClubId] = useState(null);
  const [clubIdLoading, setClubIdLoading] = useState(false);
  const [clubIdError, setClubIdError] = useState(null);
  
  // Get user info from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token || !userData.id) {
      navigate('/login');
      return;
    }
    
    setUser(userData);
  }, [navigate]);
  
  // Get user's name with fallbacks
  const getUserName = () => {
    if (!user) return 'User';
    if (user.name) {
      return user.name.split(' ')[0];
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Check if user is club head
  const isClubHead = user && user.role === 'club_head';

  useEffect(() => {
    const loadClubId = async () => {
      if (!user || !isClubHead) {
        setClubId(null);
        setClubIdError(null);
        return;
      }

      try {
        setClubIdLoading(true);
        setClubIdError(null);
        const response = await apiService.getClubIdByClubHead(user.id);
        if (response.success) {
          setClubId(response.clubId);
        } else {
          setClubId(null);
          setClubIdError(response.error || 'No club assigned yet.');
        }
      } catch (err) {
        console.error('Failed to fetch club for head:', err);
        setClubId(null);
        setClubIdError('Unable to load your club details.');
      } finally {
        setClubIdLoading(false);
      }
    };

    loadClubId();
  }, [user, isClubHead]);
  // Fetch upcoming events
  useEffect(() => {
    if (!user) return;
    
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await apiService.getEvents();
        if (response.success) {
          // Get only the first 3 upcoming events for dashboard
          setUpcomingEvents(response.events.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user]);

  if (!user) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <NavBar activePage="dashboard" />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="welcome-section">
          <h1 className="welcome-title">
            Hey, Welcome {getUserName()}
            {isClubHead && (
              <span className="role-badge club-head-badge">Club Head</span>
            )}
          </h1>
          <p className="welcome-subtitle">Take a look at what's happening in campus</p>
        </div>

        {/* Club Head Actions */}
        {isClubHead && (
          <div className="club-head-section">
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => navigate('/create-event')}
                >
                  Create Event
                </button>
                <button 
                  className="action-btn secondary"
                  disabled={!clubId || clubIdLoading}
                  onClick={() => clubId && navigate(`/clubs/${clubId}/manage`)}
                >
                  {clubIdLoading ? 'Loading...' : 'Manage Club'}
                </button>
              </div>
              {clubIdError && (
                <p style={{ marginTop: '0.5rem', color: '#c53030', fontSize: '0.9rem' }}>{clubIdError}</p>
              )}
            </div>
          </div>
        )}

        <div className="events-section">
          <div className="upcoming-events-card">
            <h2 className="section-title">Upcoming Events</h2>
            <div className="events-content">
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                </div>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : upcomingEvents.length > 0 ? (
                <div className="events-list">
                  {upcomingEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="event-item"
                      onClick={() => navigate(`/events/${event.id}/register`)}
                      style={{ cursor: 'pointer', transition: 'transform 0.2s ease, background 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <h4 className="event-name">{event.name}</h4>
                      <p className="event-date">
                        {apiService.formatEventDate(event.event_date)}
                      </p>
                      <p className="event-time">
                        {apiService.formatEventTime(event.start_time)}
                      </p>
                      <p className="event-club">by {event.club_name}</p>
                    </div>
                  ))}
                  <button 
                    className="view-all-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/events');
                    }}
                  >
                    View All Events →
                  </button>
                </div>
              ) : (
                <p className="no-events">No upcoming events at the moment</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}