import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, Calendar, Trophy, Settings, Plus, ExternalLink,
  MapPin, Mail, Clock, Shield, AlertCircle, Search, ArrowRight
} from 'lucide-react';
import NavBar from '../../components/NavBar';
import apiService from '../../services/apiService';

export default function ManageClub() {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');

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
      if (!user) return;

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

        if (!isActive) return;

        if (clubResponse.success) {
          setClub({ ...managedClubResponse.club, ...clubResponse.club });
        } else {
          setClub(managedClubResponse.club);
        }

        setMembers(membersResponse.success ? membersResponse.members : []);
        setEvents(eventsResponse.success ? eventsResponse.events : []);

        const supplementalErrors = [];
        if (!clubResponse.success) supplementalErrors.push(clubResponse.error || 'Unable to load club details.');
        if (!membersResponse.success) supplementalErrors.push(membersResponse.error || 'Unable to load club members.');
        if (!eventsResponse.success) supplementalErrors.push(eventsResponse.error || 'Unable to load club events.');

        setError(supplementalErrors.length > 0 ? supplementalErrors.join(' ') : null);
      } catch (err) {
        if (!isActive) return;
        console.error('Failed to load manage club data:', err);
        setError('Unable to load club details right now.');
      } finally {
        if (isActive) setPageLoading(false);
      }
    };

    initialize();

    return () => { isActive = false; };
  }, [user, clubId, navigate]);

  const activeMembers = useMemo(
    () => members.filter((member) => member.role === 'Head' || member.role === 'Member'),
    [members]
  );

  const filteredMembers = useMemo(() => {
    return activeMembers.filter(m =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [activeMembers, memberSearch]);

  // Safely combine date and time from different DB formats
  const getEventDateTime = (event) => {
    const rawDate = event?.event_date;
    const rawTime = event?.start_time;

    let dateOnly;
    if (!rawDate) return null;
    if (typeof rawDate === 'string') {
      dateOnly = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
    } else if (rawDate instanceof Date) {
      const iso = rawDate.toISOString();
      dateOnly = iso.split('T')[0];
    } else {
      try {
        const iso = new Date(rawDate).toISOString();
        dateOnly = iso.split('T')[0];
      } catch {
        return null;
      }
    }

    let timeOnly = rawTime || '00:00:00';
    if (typeof timeOnly === 'string' && timeOnly.length === 5) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar activePage="dashboard" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl inline-block mb-6">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Club Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "We could not find the club you're looking for."}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      <NavBar activePage="dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-3 text-slate-900">{club.name}</h1>
              <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
                {club.description || 'No description provided yet.'}
              </p>

              <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield size={16} className="text-indigo-600" />
                  <span>Head: {club.head_name || user?.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-indigo-600" />
                  <span>{club.campus_name || 'Campus Not Assigned'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={16} className="text-indigo-600" />
                  <span>{club.member_count || activeMembers.length} Members</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/create-event')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Plus size={18} />
                Create Event
              </button>
              <button
                onClick={() => navigate(`/clubs/${clubId}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ExternalLink size={18} />
                Public Page
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Upcoming Events */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Upcoming Events</h2>
                  <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium shadow-sm">
                    {upcomingEvents.length}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No upcoming events. Plan one to engage your club!</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 rounded-xl p-4 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{event.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {apiService.formatEventDate(event.event_date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {apiService.formatEventTime(event.start_time)}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${event.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            event.status === 'Pending_Approval' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {event.status?.replace('_', ' ') || 'Pending'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/50">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Users size={16} />
                              <span>{event.current_registrations || 0} Reg</span>
                            </div>
                            {event.waitlisted_count > 0 && (
                              <div className="flex items-center gap-1.5 text-yellow-600">
                                <Clock size={16} />
                                <span>{event.waitlisted_count} Waitlist</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/events/${event.id}/manage`)}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                          >
                            Manage <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* All Events Table */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Trophy size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">All Events History</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                {sortedEvents.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No events recorded yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">Event Name</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-center">Registrations</th>
                        <th className="px-6 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">{event.name}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {apiService.formatEventDate(event.event_date)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${event.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              event.status === 'Pending_Approval' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {event.status?.replace('_', ' ') || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-500">
                            {event.registered_count || 0}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => navigate(`/events/${event.id}/manage`)}
                              className="text-indigo-600 hover:text-indigo-700 font-medium text-xs"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Members Card */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                      <Users size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-800">Members</h2>
                  </div>
                  <span className="px-2.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-medium shadow-sm">
                    {activeMembers.length}
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto p-2">
                {activeMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No members yet.</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No members found.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-medium text-sm border border-indigo-100">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-slate-900 truncate">{member.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${member.role === 'Head'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
