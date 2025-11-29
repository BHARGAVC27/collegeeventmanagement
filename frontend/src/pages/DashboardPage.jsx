import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, ArrowRight, Plus, Settings, AlertCircle, Sparkles, Users } from 'lucide-react'
import apiService from '../services/apiService'
import NavBar from '../components/NavBar'

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clubId, setClubId] = useState(null);
  const [clubStats, setClubStats] = useState({ members: 0, events: 0, nextEvent: null });
  const [clubIdLoading, setClubIdLoading] = useState(false);
  const [clubIdError, setClubIdError] = useState(null);

  // Get user info from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    const userData = JSON.parse(userStr || '{}');

    if (!token || !userData.id) {
      // Clear potentially corrupted state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');

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
    const loadClubData = async () => {
      if (!user || !isClubHead) {
        setClubId(null);
        setClubIdError(null);
        return;
      }

      try {
        setClubIdLoading(true);
        setClubIdError(null);

        // 1. Get Club ID
        const response = await apiService.getClubIdByClubHead(user.id);
        if (!response.success) {
          setClubId(null);
          setClubIdError(response.error || 'No club assigned yet.');
          return;
        }

        const id = response.clubId;
        setClubId(id);

        // 2. Fetch Stats (Members & Events)
        const [membersRes, eventsRes] = await Promise.all([
          apiService.getClubMembersPublic(id),
          apiService.getClubEvents(id)
        ]);

        const stats = { members: 0, events: 0, nextEvent: null };

        if (membersRes.success) {
          stats.members = membersRes.members.length;
        }

        if (eventsRes.success) {
          stats.events = eventsRes.events.length;

          // Find next upcoming event
          const now = new Date();
          const upcoming = eventsRes.events
            .filter(e => new Date(e.event_date) >= now)
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

          if (upcoming.length > 0) {
            stats.nextEvent = upcoming[0].event_date;
          }
        }

        setClubStats(stats);

      } catch (err) {
        console.error('Failed to fetch club data:', err);
        setClubId(null);
        setClubIdError('Unable to load your club details.');
      } finally {
        setClubIdLoading(false);
      }
    };

    loadClubData();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20 selection:text-primary">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16 space-y-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl -z-10"></div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Hey, Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">{getUserName()}</span>
            </h1>
            {isClubHead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <Sparkles className="w-3 h-3 mr-1" /> Club Head
              </span>
            )}
          </div>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Take a look at what's happening on campus and manage your events.
          </p>
        </div>

        {/* Club Stats Overview */}
        {isClubHead && clubId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Members</p>
                <h3 className="text-2xl font-bold text-slate-900">{clubStats.members}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Events</p>
                <h3 className="text-2xl font-bold text-slate-900">{clubStats.events}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Next Event</p>
                <h3 className="text-lg font-bold text-slate-900">
                  {clubStats.nextEvent ? apiService.formatEventDate(clubStats.nextEvent) : 'None Planned'}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout (Vertical Stack) */}
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Club Head Actions */}
          {isClubHead && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => navigate('/create-event')}
                className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 text-left h-full"
              >
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-black/10 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/10">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/90">
                      New
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-1 tracking-tight">Create Event</h4>
                    <p className="text-indigo-100 text-xs font-medium leading-relaxed opacity-90">
                      Launch a new event for your club.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => clubId && navigate(`/clubs/${clubId}/manage`)}
                disabled={!clubId || clubIdLoading}
                className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 text-left disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none h-full"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-colors group-hover:bg-indigo-50/50"></div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      <Settings className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      Settings
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-slate-800 mb-1 tracking-tight group-hover:text-indigo-900 transition-colors">Manage Club</h4>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed group-hover:text-slate-600 transition-colors">
                      Update members and details.
                    </p>
                  </div>
                </div>
              </button>

              {clubIdError && (
                <div className="col-span-full mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {clubIdError}
                </div>
              )}
            </div>
          )}

          {/* Events Section */}
          <div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                </h2>
                <button
                  onClick={() => navigate('/events')}
                  className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    {error}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}/register`)}
                        className="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
                            {event.name}
                          </h4>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm shrink-0 ml-2">
                            {event.event_type}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary/70" />
                            {apiService.formatEventDate(event.event_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary/70" />
                            {apiService.formatEventTime(event.start_time)}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary/70" />
                            <span className="italic truncate">by {event.club_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No upcoming events at the moment</p>
                  </div>
                )}
              </div>

              {upcomingEvents.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => navigate('/events')}
                    className="text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                  >
                    Discover more events on campus
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}