import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, Trophy, Save, CheckCircle, XCircle, AlertCircle, Search } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import NavBar from '../../components/NavBar';
import apiService from '../../services/apiService';

export default function ManageEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [winners, setWinners] = useState({ 1: null, 2: null, 3: null });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r =>
      r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registrations, searchTerm]);

  const handleToggleAttendance = async (registration) => {
    const next = !registration.attended;
    // optimistic update
    setRegistrations(prev => prev.map(r => r.registration_id === registration.registration_id ? { ...r, attended: next } : r));
    const res = await apiService.updateRegistrationAttendance(eventId, registration.registration_id, next);
    if (!res.success) {
      // revert
      setRegistrations(prev => prev.map(r => r.registration_id === registration.registration_id ? { ...r, attended: !next } : r));
      toast.error('Update Failed', {
        description: res.error || 'Failed to update attendance'
      });
    } else {
      toast.success(next ? 'Marked Present' : 'Marked Absent', {
        duration: 2000
      });
    }
  };

  const handleSaveWinners = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build winners array, skip nulls, ensure unique student_ids
      const selected = [1, 2, 3]
        .map(pos => winners[pos] ? { position: pos, student_id: Number(winners[pos]) } : null)
        .filter(Boolean);
      const uniqueIds = new Set(selected.map(w => w.student_id));
      if (uniqueIds.size !== selected.length) {
        toast.warning('Invalid Selection', {
          description: 'Each winner position must be a different student'
        });
        setSaving(false);
        return;
      }
      const res = await apiService.saveEventWinners(eventId, selected);
      if (!res.success) {
        toast.error('Save Failed', {
          description: res.error || 'Failed to save winners'
        });
      } else {
        toast.success('Winners Saved! 🏆', {
          description: 'Event winners have been updated successfully.'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar activePage="events" />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar activePage="events" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl inline-block mb-6">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          {error && <p className="text-slate-500 mb-6">{error}</p>}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back to Events</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">{event.name}</h1>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {apiService.formatEventDate(event.event_date)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  {apiService.formatEventTime(event.start_time)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                {event.status}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Attendance</h2>
                  <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium shadow-sm">
                    {registrations.length}
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {registrations.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No registrations yet.</p>
                  </div>
                ) : filteredRegistrations.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No students found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Student</th>
                        <th className="px-6 py-3 font-medium">Roll Number</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-center">Attended</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegistrations.map((r) => (
                        <tr key={r.registration_id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{r.student_name}</td>
                          <td className="px-6 py-4 text-slate-500">{r.roll_number}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${r.registration_status === 'Registered'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                              {r.registration_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(r)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${r.attended
                                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              title={r.attended ? "Mark as absent" : "Mark as present"}
                            >
                              {r.attended ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Winners Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                  <Trophy size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Winners</h2>
              </div>

              <div className="p-6">
                <form onSubmit={handleSaveWinners} className="space-y-6">
                  {[1, 2, 3].map((pos) => (
                    <div key={pos} className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        {pos === 1 && <span className="text-yellow-500">🥇</span>}
                        {pos === 2 && <span className="text-slate-400">🥈</span>}
                        {pos === 3 && <span className="text-amber-700">🥉</span>}
                        Position {pos}
                      </label>
                      <select
                        value={winners[pos] || ''}
                        onChange={e => setWinners(prev => ({ ...prev, [pos]: e.target.value || null }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                      >
                        <option value="">-- Select Winner --</option>
                        {attendees.map(a => (
                          <option key={a.student_id} value={a.student_id}>
                            {a.student_name} ({a.roll_number})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      {saving ? 'Saving...' : 'Save Winners'}
                    </button>
                    <p className="mt-3 text-xs text-center text-slate-400">
                      Only students marked as "Attended" can be selected as winners.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
