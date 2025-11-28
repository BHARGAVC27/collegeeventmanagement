import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users, Calendar, MapPin, Mail, Shield, ExternalLink, UserPlus, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function ClubDetails() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const [club, setClub] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)

    if (clubId) {
      fetchClubData()
    }
  }, [clubId])

  const fetchClubData = async () => {
    try {
      setLoading(true)
      const [clubResponse, eventsResponse] = await Promise.all([
        apiService.getClubById(clubId),
        apiService.getClubEvents(clubId)
      ])

      if (clubResponse.success) {
        setClub(clubResponse.club)
      }

      if (eventsResponse.success) {
        // Filter for approved upcoming events
        const now = new Date()
        const upcoming = (eventsResponse.events || [])
          .filter(e => e.status === 'Approved' && new Date(e.event_date) >= now)
          .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        setEvents(upcoming)
      }
    } catch (err) {
      console.error('Error fetching club details:', err)
      toast.error('Error', { description: 'Failed to load club details.' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClub = async () => {
    if (!user || !user.email) {
      navigate('/login')
      return
    }

    try {
      setJoining(true)
      const response = await apiService.joinClub(clubId, user.email)

      if (response.success) {
        toast.success('Club Joined! 🎉', {
          description: `Successfully joined ${club.name}!`
        })
        fetchClubData() // Refresh to update member count
      } else {
        toast.error('Join Failed', {
          description: response.error || 'Failed to join club'
        })
      }
    } catch (err) {
      console.error('Failed to join club:', err)
      toast.error('Error', {
        description: 'Failed to join club. Please try again.'
      })
    } finally {
      setJoining(false)
    }
  }

  // Get club image based on name (placeholder logic)
  const getClubImage = (clubName) => {
    if (!clubName) return ''
    const lowerName = clubName.toLowerCase()
    if (lowerName.includes('coding') || lowerName.includes('tech')) {
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=400&fit=crop'
    } else if (lowerName.includes('music')) {
      return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=400&fit=crop'
    } else if (lowerName.includes('sport')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop'
    }
    return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=400&fit=crop'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <NavBar activePage="clubs" />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Club Not Found</h2>
          <button onClick={() => navigate('/clubs')} className="mt-4 text-indigo-600 hover:underline">
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="clubs" />

      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent z-10" />
        <img
          src={getClubImage(club.name)}
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold mb-3 shadow-sm">
                Active Club
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{club.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Head: {club.head_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>{club.campus_name || 'Main Campus'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <span>{club.email || 'No contact email'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinClub}
              disabled={joining}
              className="flex items-center gap-2 px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {joining ? (
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {joining ? 'Joining...' : 'Join Club'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: About & Stats */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About the Club</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {club.description || 'No description available for this club.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-100">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">{club.member_count || 0}</div>
                  <div className="text-sm text-slate-500 font-medium">Members</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-3xl font-bold text-violet-600 mb-1">{events.length}</div>
                  <div className="text-sm text-slate-500 font-medium">Upcoming Events</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-3xl font-bold text-pink-600 mb-1">Active</div>
                  <div className="text-sm text-slate-500 font-medium">Status</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Upcoming Events
                </h2>
                {events.length > 0 && (
                  <button
                    onClick={() => navigate('/events')}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map(event => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}/register`)}
                      className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden shrink-0">
                        <img
                          src={event.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.name)}&background=random`}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate pr-4">
                            {event.name}
                          </h3>
                          <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                            {event.event_type}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2 mt-1 mb-3">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            {apiService.formatEventDate(event.event_date)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {apiService.formatEventTime(event.start_time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No upcoming events scheduled yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20">
              <h3 className="text-lg font-bold mb-2">Want to join?</h3>
              <p className="text-indigo-100 text-sm mb-6">
                Become a member of {club.name} to participate in exclusive events, workshops, and meet like-minded people.
              </p>
              <button
                onClick={handleJoinClub}
                disabled={joining}
                className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-80"
              >
                {joining ? 'Joining...' : 'Join Now'}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Club Leadership
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                  {club.head_name?.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-slate-900">{club.head_name}</div>
                  <div className="text-xs text-slate-500">Club Head</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
