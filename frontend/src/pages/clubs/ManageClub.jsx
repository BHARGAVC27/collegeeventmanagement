import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import apiService from '../../services/apiService';
import './ManageClub.css';

export default function ManageClub() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !userData?.id) {
      navigate('/login', { replace: true });
      return;
    }

    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      if (!user) {
        return;
      }

      if (user.role !== 'club_head') {
        navigate('/dashboard', { replace: true });
        return;
      }

      try {
        setPageLoading(true);
        setError(null);

        const managedClubResponse = await apiService.getClubIdByClubHead(user.id);
        if (!managedClubResponse.success) {
          if (!isActive) return;
          setError(managedClubResponse.error || 'No club assigned to your account yet.');
          setPageLoading(false);
          return;
        }

        const managedClubId = managedClubResponse.clubId;
        if (String(managedClubId) !== String(clubId)) {
          navigate(`/clubs/${managedClubId}/manage`, { replace: true });
          return;
        }

        const [clubResponse, membersResponse, eventsResponse] = await Promise.all([
          apiService.getClubById(managedClubId),
          apiService.getClubMembersPublic(managedClubId),
          apiService.getClubEvents(managedClubId),
        ]);

        if (!isActive) {
          return;
        }

        if (clubResponse.success) {
          setClub({ ...managedClubResponse.club, ...clubResponse.club });
        } else {
          setClub(managedClubResponse.club);
        }

        setMembers(membersResponse.success ? membersResponse.members : []);
        setEvents(eventsResponse.success ? eventsResponse.events : []);

        const supplementalErrors = [];
        if (!clubResponse.success) {
          supplementalErrors.push(clubResponse.error || 'Unable to load club details.');
        }
        if (!membersResponse.success) {
          supplementalErrors.push(membersResponse.error || 'Unable to load club members.');
        }
        if (!eventsResponse.success) {
          supplementalErrors.push(eventsResponse.error || 'Unable to load club events.');
        }

        setError(supplementalErrors.length > 0 ? supplementalErrors.join(' ') : null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        console.error('Failed to load manage club data:', err);
        setError('Unable to load club details right now.');
      } finally {
        if (isActive) {
          setPageLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isActive = false;
    };
  }, [user, clubId, navigate]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.role === 'Head' || member.role === 'Member'),
    [members]
  );

  // Safely combine date and time from different DB formats
  const getEventDateTime = (event) => {
    const rawDate = event?.event_date;
    const rawTime = event?.start_time;

    // Derive date-only portion
    let dateOnly;
    if (!rawDate) return null;
    if (typeof rawDate === 'string') {
      // If it already includes a time (has 'T'), take only the date part
      dateOnly = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
    } else if (rawDate instanceof Date) {
      // Convert to YYYY-MM-DD
      const iso = rawDate.toISOString();
      dateOnly = iso.split('T')[0];
    } else {
      // Fallback
      try {
        const iso = new Date(rawDate).toISOString();
        dateOnly = iso.split('T')[0];
      } catch {
        return null;
      }
    }

    // Normalize time
    let timeOnly = rawTime || '00:00:00';
    if (typeof timeOnly === 'string' && timeOnly.length === 5) {
      // HH:MM -> HH:MM:00
      timeOnly = `${timeOnly}:00`;
    }

    const combined = `${dateOnly}T${timeOnly}`;
    const dt = new Date(combined);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const firstDate = getEventDateTime(a) || new Date(0);
      const secondDate = getEventDateTime(b) || new Date(0);
      return secondDate - firstDate;
    });
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return sortedEvents.filter((event) => {
      const dt = getEventDateTime(event);
      return dt && dt >= now;
    });
  }, [sortedEvents]);

  if (pageLoading) {
    return (
      <div className="page-root">
        <NavBar activePage="dashboard" />
        <main className="manage-club-main">
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading club management tools...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="page-root">
        <NavBar activePage="dashboard" />
        <main className="manage-club-main">
          <div className="empty-state">
            <div className="empty-icon">🏛️</div>
            <h2>We could not find a club to manage.</h2>
            {error && <p className="error-message">{error}</p>}
            <button className="manage-action-btn" onClick={() => navigate('/dashboard')}>
              Go back to dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-root manage-club-page">
      <NavBar activePage="dashboard" />
      <main className="manage-club-main">
        <div className="manage-club-container">
          <section className="club-overview-card">
            <header>
              <h1>{club.name}</h1>
              <p>{club.description || 'No description provided yet.'}</p>
            </header>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="label">Club Head</span>
                <strong>{club.head_name || user?.name}</strong>
                <small>{club.head_email || user?.email}</small>
              </div>
              <div className="overview-item">
                <span className="label">Members</span>
                <strong>{club.member_count || activeMembers.length}</strong>
                <small>Active members</small>
              </div>
              <div className="overview-item">
                <span className="label">Faculty Coordinator</span>
                <strong>{club.faculty_coordinator || 'Not Assigned'}</strong>
                {club.campus_name && <small>{club.campus_name}</small>}
              </div>
              <div className="overview-item">
                <span className="label">Head Since</span>
                <strong>{club.head_since ? new Date(club.head_since).toLocaleDateString() : 'N/A'}</strong>
                {club.campus_location && <small>{club.campus_location}</small>}
              </div>
            </div>
            <div className="manage-actions">
              <button className="manage-action-btn primary" onClick={() => navigate('/create-event')}>
                Create Event
              </button>
              <button className="manage-action-btn" onClick={() => navigate(`/clubs/${clubId}`)}>
                View public club page
              </button>
            </div>
            {error && <p className="inline-error">{error}</p>}
          </section>

          <section className="club-section">
            <header className="section-header">
              <h2>Upcoming Events</h2>
              <span className="badge">{upcomingEvents.length}</span>
            </header>
            {upcomingEvents.length === 0 ? (
              <div className="empty-state light">
                <div className="empty-icon">📅</div>
                <p>No upcoming events yet. Plan one to engage your club!</p>
              </div>
            ) : (
              <div className="events-grid">
                {upcomingEvents.map((event) => (
                  <article key={event.id} className="event-card">
                    <header>
                      <h3>{event.name}</h3>
                      <span className={`status-pill status-${event.status?.toLowerCase() || 'pending'}`}>
                        {event.status?.replace('_', ' ') || 'Pending'}
                      </span>
                    </header>
                    <dl>
                      <div>
                        <dt>Date</dt>
                        <dd>{apiService.formatEventDateTime(event.event_date, event.start_time)}</dd>
                      </div>
                      <div>
                        <dt>Registrations</dt>
                        <dd>
                          {event.current_registrations ?? event.registered_count ?? 0}
                          {event.max_participants ? ` / ${event.max_participants}` : ''}
                        </dd>
                      </div>
                      {event.waitlisted_count > 0 && (
                        <div>
                          <dt>Waitlisted</dt>
                          <dd>{event.waitlisted_count}</dd>
                        </div>
                      )}
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="club-section">
            <header className="section-header">
              <h2>All Events</h2>
              <span className="badge">{sortedEvents.length}</span>
            </header>
            {sortedEvents.length === 0 ? (
              <div className="empty-state light">
                <div className="empty-icon">🎯</div>
                <p>No events recorded yet.</p>
              </div>
            ) : (
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Registrations</th>
                    <th>Waitlisted</th>
                    <th>Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{event.name}</td>
                      <td>{apiService.formatEventDateTime(event.event_date, event.start_time)}</td>
                      <td>
                        <span className={`status-pill status-${event.status?.toLowerCase() || 'pending'}`}>
                          {event.status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td>{event.registered_count || 0}</td>
                      <td>{event.waitlisted_count || 0}</td>
                      <td>{event.cancelled_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="club-section">
            <header className="section-header">
              <h2>Club Members</h2>
              <span className="badge">{activeMembers.length}</span>
            </header>
            {activeMembers.length === 0 ? (
              <div className="empty-state light">
                <div className="empty-icon">👥</div>
                <p>No members yet. Share your club invite link to grow your team.</p>
              </div>
            ) : (
              <div className="members-grid">
                {activeMembers.map((member) => (
                  <article key={member.id} className="member-card">
                    <header>
                      <h3>{member.name}</h3>
                      <span className={`role-pill role-${member.role?.toLowerCase() || 'member'}`}>
                        {member.role}
                      </span>
                    </header>
                    <p>{member.email}</p>
                    <small>Joined on {new Date(member.join_date).toLocaleDateString()}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
