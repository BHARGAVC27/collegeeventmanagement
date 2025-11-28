import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'sonner'
import { Calendar, MapPin, Clock, XCircle, ArrowRight, Users, Ticket } from 'lucide-react'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function MyEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  const getUserName = () => {
    if (!user) return 'User'
    if (user.name) return user.name.split(' ')[0]
    if (user.email) return user.email.split('@')[0]
    return 'User'
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = JSON.parse(localStorage.getItem('user') || '{}')

    if (!token || !userData.email) {
      setLoading(false)
      return
    }

    const fetchMyEvents = async () => {
      try {
        setLoading(true)
        setUser(userData)
        const response = await apiService.getMyRegisteredEvents(userData.email)

        if (response.success) {
          setEvents(response.events || [])
        } else {
          setError(response.error || 'Failed to fetch your events')
          toast.error('Failed to load your events')
        }
      } catch (err) {
        console.error('Failed to fetch my events:', err)
        setError('Failed to load your registered events')
        toast.error('Failed to load your events')
      } finally {
        setLoading(false)
      }
    }

    fetchMyEvents()
  }, [])

  const handleCancelRegistration = async (eventId, eventName, e) => {
    e.stopPropagation()

    if (!confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      return
    }

    try {
      const email = user.email
      const response = await apiService.cancelEventRegistration(eventId, email)

      if (response.success) {
        setEvents(events.filter(event => event.id !== eventId))
        toast.success('Registration cancelled successfully!')
      } else {
        toast.error(response.error || 'Failed to cancel registration')
      }
    } catch (err) {
      console.error('Error cancelling registration:', err)
      toast.error('Failed to cancel registration')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-center" richColors />
      <NavBar activePage="my-events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
            Welcome back, <span className="text-indigo-600">{getUserName()}! 👋</span>
          </h1>
          <p className="text-slate-500 text-lg mb-8">
            Manage your event registrations and stay updated with your schedule.
          </p>

          {events.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600 mb-1">{events.length}</div>
                <div className="text-sm text-slate-500 font-medium">Registered Events</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-violet-600 mb-1">
                  {events.filter(e => new Date(e.event_date) >= new Date()).length}
                </div>
                <div className="text-sm text-slate-500 font-medium">Upcoming</div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-6 mb-8 flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events && events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                  {/* Image Header */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img
                      src={event.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.name)}&background=random&size=400`}
                      alt={event.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.name)}&background=random&size=400`
                      }}
                    />
                    <div className="absolute top-4 right-4 z-20">
                      <span className="px-3 py-1 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold shadow-sm flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Registered
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 z-20">
                      <h3 className="text-xl font-bold text-white mb-1 leading-tight">{event.name}</h3>
                      <p className="text-white/90 text-sm flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Hosted by {event.club_name}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{apiService.formatEventDate(event.event_date)}</span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium">{apiService.formatEventTime(event.start_time)}</span>
                      </div>

                      {event.venue_name && (
                        <div className="flex items-center gap-3 text-slate-600">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{event.venue_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 font-medium text-sm"
                        onClick={(e) => handleCancelRegistration(event.id, event.name, e)}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Registration
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No registered events</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  You haven't registered for any events yet. Explore upcoming events and join the community!
                </p>
                <a
                  href="/events"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                  Browse Events
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
