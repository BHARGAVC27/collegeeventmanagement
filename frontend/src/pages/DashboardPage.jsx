import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, ArrowRight, Plus, Settings, AlertCircle, Sparkles } from 'lucide-react'
import apiService from '../services/apiService'
import NavBar from '../components/NavBar'

export default function DashboardPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16 space-y-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Hey, Welcome <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{getUserName()}</span>
            </h1>
            {isClubHead && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                <Sparkles className="w-3 h-3 mr-1" /> Club Head
              </span>
            )}
          </div>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Take a look at what's happening on campus and manage your events.
          </p>
        </div>

        {/* Club Head Actions */}
        {isClubHead && (
          <div className="mb-12 max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800">
                <Settings className="w-5 h-5 text-indigo-600" />
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/create-event')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Create Event
                </button>
                <button
                  onClick={() => clubId && navigate(`/clubs/${clubId}/manage`)}
                  disabled={!clubId || clubIdLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Settings className="w-5 h-5" />
                  {clubIdLoading ? 'Loading...' : 'Manage Club'}
                </button>
              </div>
              {clubIdError && (
                <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4" />
                  {clubIdError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Events
              </h2>
              <button
                onClick={() => navigate('/events')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
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
                      className="group relative bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-100 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {event.name}
                        </h4>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                          {event.event_type}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500/70" />
                          {apiService.formatEventDate(event.event_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-500/70" />
                          {apiService.formatEventTime(event.start_time)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-500/70" />
                          <span className="italic">by {event.club_name}</span>
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
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  Discover more events on campus
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}