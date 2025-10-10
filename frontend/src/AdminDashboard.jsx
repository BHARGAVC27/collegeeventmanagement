import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = localStorage.getItem('userType');
    const token = localStorage.getItem('token');

    if (!token || userType !== 'admin' || !userData.role?.includes('admin')) {
      navigate('/admin/login');
      return;
    }

    setUser(userData);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/stats', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Fetch pending events
      const eventsResponse = await fetch('/api/events/pending', { headers });
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setPendingEvents(eventsData.events || []);
      }

      // Fetch clubs
      const clubsResponse = await fetch('/api/admin/clubs', { headers });
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        setClubs(clubsData.clubs || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventAction = async (eventId, action, reason = '') => {
    try {
      const token = localStorage.getItem('token');
      const url = `/api/events/${eventId}/${action}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          rejection_reason: reason,
          approval_notes: reason 
        })
      });

      if (response.ok) {
        // Refresh pending events
        fetchDashboardData();
        alert(`Event ${action}d successfully!`);
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${action} event`);
      }
    } catch (error) {
      console.error(`Error ${action}ing event:`, error);
      alert(`Error ${action}ing event`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-left">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name}</p>
          </div>
          <div className="admin-header-right">
            <span className="admin-role-badge">{user?.role}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <div className="admin-nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Pending Events ({pendingEvents.length})
          </button>
          <button 
            className={`nav-tab ${activeTab === 'clubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            Clubs Management
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Stats Cards */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon clubs-icon">🏛️</div>
                  <div className="stat-content">
                    <h3>{stats.clubs.total_clubs}</h3>
                    <p>Total Clubs</p>
                    <small>{stats.clubs.active_clubs} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon events-icon">📅</div>
                  <div className="stat-content">
                    <h3>{stats.events.total_events}</h3>
                    <p>Total Events</p>
                    <small>{stats.events.upcoming_events} upcoming</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon users-icon">👥</div>
                  <div className="stat-content">
                    <h3>{stats.users.total_students}</h3>
                    <p>Total Students</p>
                    <small>{stats.users.club_heads} club heads</small>
                  </div>
                </div>
                <div className="stat-card pending">
                  <div className="stat-icon pending-icon">⏳</div>
                  <div className="stat-content">
                    <h3>{stats.events.pending_events}</h3>
                    <p>Pending Approvals</p>
                    <small>Requires action</small>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveTab('events')}
                >
                  Review Pending Events
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => setActiveTab('clubs')}
                >
                  Manage Clubs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            <div className="section-header">
              <h2>Pending Event Approvals</h2>
              <p>Review and approve/reject events submitted by club heads</p>
            </div>
            
            {pendingEvents.length === 0 ? (
              <div className="empty-state">
                <p>No pending events to review</p>
              </div>
            ) : (
              <div className="events-list">
                {pendingEvents.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className="event-type">{event.event_type}</span>
                    </div>
                    <div className="event-details">
                      <p><strong>Club:</strong> {event.club_name}</p>
                      <p><strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.start_time} - {event.end_time}</p>
                      <p><strong>Venue:</strong> {event.venue_name || 'TBD'}</p>
                      <p><strong>Created by:</strong> {event.created_by}</p>
                      {event.description && (
                        <p><strong>Description:</strong> {event.description}</p>
                      )}
                    </div>
                    <div className="event-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleEventAction(event.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for rejection:');
                          if (reason) {
                            handleEventAction(event.id, 'reject', reason);
                          }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="clubs-section">
            <div className="section-header">
              <h2>Clubs Management</h2>
              <button className="create-club-btn">Create New Club</button>
            </div>
            
            <div className="clubs-grid">
              {clubs.map(club => (
                <div key={club.id} className="club-card">
                  <div className="club-header">
                    <h3>{club.name}</h3>
                    <span className={`status-badge ${club.is_active ? 'active' : 'inactive'}`}>
                      {club.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="club-details">
                    <p><strong>Campus:</strong> {club.campus_name}</p>
                    <p><strong>Members:</strong> {club.member_count}</p>
                    <p><strong>Events:</strong> {club.event_count}</p>
                    {club.faculty_coordinator_name && (
                      <p><strong>Coordinator:</strong> {club.faculty_coordinator_name}</p>
                    )}
                  </div>
                  <div className="club-actions">
                    <button className="edit-btn">Edit</button>
                    <button className="members-btn">View Members</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}