import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Search, Filter, ArrowRight, Users, Building2 } from 'lucide-react'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await apiService.getEvents()
        if (response.success) {
          setEvents(response.events)
        }
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.club_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterType === 'all' || event.event_type?.toLowerCase() === filterType.toLowerCase()

    return matchesSearch && matchesFilter
  })

  const eventTypes = ['all', ...new Set(events.map(e => e.event_type).filter(Boolean))]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <NavBar activePage="events" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">
              Upcoming <span className="text-indigo-600">Events</span>
            </h1>
            <p className="text-slate-500 text-lg">
              Discover workshops, competitions, and cultural fests happening on campus.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>

            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-slate-400" />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all cursor-pointer shadow-sm"
              >
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-6 text-center">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const isFull = event.max_participants && event.registered_count >= event.max_participants

                return (
                  <div
                    key={event.id}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer"
                    onClick={() => navigate(`/events/${event.id}/register`)}
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
                      <div className="absolute top-4 right-4 z-20 flex gap-2">
                        {isFull && (
                          <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
                            FULL
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-medium shadow-sm border border-white/50">
                          {event.event_type}
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

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Users className="w-4 h-4" />
                          <span>{event.registered_count || 0} registered</span>
                        </div>

                        <span className="text-indigo-600 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Details <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No events found</h3>
                <p className="text-slate-500">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}