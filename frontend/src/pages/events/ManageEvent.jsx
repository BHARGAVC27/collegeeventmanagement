import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NavBar from '../../components/NavBar';
import apiService from '../../services/apiService';
import './ManageEvent.css';

export default function ManageEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [winners, setWinners] = useState({ 1: null, 2: null, 3: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user?.id) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventRes, regsRes, winnersRes] = await Promise.all([
          apiService.getEventById(eventId),
          apiService.getEventRegistrations(eventId),
          apiService.getEventWinners(eventId),
        ]);

        if (!active) return;

        if (eventRes.success) setEvent(eventRes.event || eventRes.data || eventRes);
        if (regsRes.success) setRegistrations(regsRes.registrations || []);
        if (winnersRes.success) {
          const map = { 1: null, 2: null, 3: null };
          (winnersRes.winners || []).forEach(w => { map[w.position] = w.student_id; });
          setWinners(map);
        }

        if (!eventRes.success || !regsRes.success) {
          setError(eventRes.error || regsRes.error || 'Failed to load event data');
        }
      } catch (err) {
        if (!active) return;
        console.error('Failed to load manage event:', err);
        setError('Unable to load event details right now.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [eventId]);

  const attendees = useMemo(() => registrations.filter(r => r.attended), [registrations]);

  const handleToggleAttendance = async (registration) => {
    const next = !registration.attended;
    // optimistic update
    setRegistrations(prev => prev.map(r => r.registration_id === registration.registration_id ? { ...r, attended: next } : r));
    const res = await apiService.updateRegistrationAttendance(eventId, registration.registration_id, next);
    if (!res.success) {
      // revert
      setRegistrations(prev => prev.map(r => r.registration_id === registration.registration_id ? { ...r, attended: !next } : r));
      alert(res.error || 'Failed to update attendance');
    }
  };

  const handleSaveWinners = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build winners array, skip nulls, ensure unique student_ids
      const selected = [1,2,3]
        .map(pos => winners[pos] ? { position: pos, student_id: Number(winners[pos]) } : null)
        .filter(Boolean);
      const uniqueIds = new Set(selected.map(w => w.student_id));
      if (uniqueIds.size !== selected.length) {
        alert('Each winner position must be a different student');
        setSaving(false);
        return;
      }
      const res = await apiService.saveEventWinners(eventId, selected);
      if (!res.success) {
        alert(res.error || 'Failed to save winners');
      } else {
        alert('Winners saved');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-root">
        <NavBar activePage="events" />
        <main className="manage-event-main">
          <div className="loading-state"><div className="spinner"/> Loading event...</div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-root">
        <NavBar activePage="events" />
        <main className="manage-event-main">
          <div className="empty-state">
            <h2>Event not found</h2>
            {error && <p className="error-message">{error}</p>}
            <button className="manage-action-btn" onClick={() => navigate(-1)}>Go back</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-root manage-event-page">
      <NavBar activePage="events" />
      <main className="manage-event-main">
        <div className="manage-event-container">
          <header className="event-header">
            <div>
              <h1>{event.name}</h1>
              <p>{apiService.formatEventDateTime(event.event_date, event.start_time)}</p>
            </div>
            <div className="actions">
              <button className="manage-action-btn" onClick={() => navigate(-1)}>Back</button>
            </div>
          </header>

          <section className="event-section">
            <header className="section-header">
              <h2>Attendance</h2>
              <span className="badge">{registrations.length}</span>
            </header>
            {registrations.length === 0 ? (
              <div className="empty-state light">No registrations yet.</div>
            ) : (
              <table className="events-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registered At</th>
                    <th>Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.registration_id}>
                      <td>{r.student_name}</td>
                      <td>{r.roll_number}</td>
                      <td>{r.email}</td>
                      <td>{r.registration_status}</td>
                      <td>{new Date(r.registration_time).toLocaleString()}</td>
                      <td>
                        <label className="toggle">
                          <input type="checkbox" checked={!!r.attended} onChange={() => handleToggleAttendance(r)} />
                          <span> {r.attended ? 'Yes' : 'No'}</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="event-section">
            <header className="section-header">
              <h2>Winners</h2>
            </header>
            <form className="winners-form" onSubmit={handleSaveWinners}>
              {[1,2,3].map(pos => (
                <div key={pos} className="winner-row">
                  <label>Position {pos}</label>
                  <select value={winners[pos] || ''} onChange={e => setWinners(prev => ({ ...prev, [pos]: e.target.value || null }))}>
                    <option value="">-- Select --</option>
                    {attendees.map(a => (
                      <option key={a.student_id} value={a.student_id}>{a.student_name} ({a.roll_number})</option>
                    ))}
                  </select>
                </div>
              ))}
              <button className="manage-action-btn primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Winners'}</button>
            </form>
            <p className="hint">Only attendees are eligible for winner selection.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
