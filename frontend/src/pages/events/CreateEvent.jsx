import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, AlertCircle, Type, FileText, Save, ArrowLeft, Sparkles } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function CreateEvent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState([])
  const [userClub, setUserClub] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    event_type: 'Workshop',
    max_participants: '',
    registration_deadline: '',
    club_id: '',
    venue_id: ''
  })

  const eventTypes = [
    'Workshop',
    'Seminar',
    'Competition',
    'Cultural',
    'Sports',
    'Meeting',
    'Other'
  ]

  // Check if user is club head
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userType = localStorage.getItem('userType')

    if (userType !== 'student' || !user.role?.includes('club_head')) {
      toast.error('Access denied', {
        description: 'Only club heads can create events.'
      })
      setTimeout(() => navigate('/dashboard'), 2000)
      return
    }

    fetchInitialData()
  }, [navigate])

  const fetchInitialData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      // Fetch venues
      const venuesResponse = await apiService.getVenues()
      if (venuesResponse.success) {
        setVenues(venuesResponse.venues || [])
      }

      // Fetch user's clubs to find which club they are head of
      const clubsResponse = await apiService.getClubs()

      if (clubsResponse.success) {
        const clubs = clubsResponse.clubs || []

        // Find the club where current user is the head
        const myClub = clubs.find(club => {
          return club.club_head_id === user.id || club.club_head_email === user.email
        })

        if (myClub) {
          setUserClub(myClub)
          // Automatically set the club_id in form
          setFormData(prev => ({
            ...prev,
            club_id: myClub.id.toString()
          }))
        } else {
          toast.error('No Club Assigned', {
            description: 'You are not assigned as head of any club. Please contact admin.'
          })
          setTimeout(() => navigate('/dashboard'), 2000)
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Error', { description: 'Failed to load initial data.' })
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    const required = ['name', 'description', 'event_date', 'start_time', 'end_time', 'club_id', 'max_participants']
    const missing = required.filter(field => !formData[field])

    if (missing.length > 0) {
      toast.error('Missing Fields', {
        description: `Please fill in all required fields: ${missing.join(', ')}`
      })
      return false
    }

    // Validate max_participants is a positive number
    if (parseInt(formData.max_participants) <= 0) {
      toast.error('Invalid Participants', {
        description: 'Max participants must be greater than 0'
      })
      return false
    }

    // Validate date is not in the past
    const eventDate = new Date(formData.event_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      toast.error('Invalid Date', {
        description: 'Event date cannot be in the past'
      })
      return false
    }

    // Validate time order
    if (formData.start_time >= formData.end_time) {
      toast.error('Invalid Time', {
        description: 'Start time must be before end time'
      })
      return false
    }

    // Validate registration deadline if provided
    if (formData.registration_deadline) {
      const regDeadline = new Date(formData.registration_deadline)
      if (regDeadline > eventDate) {
        toast.error('Invalid Deadline', {
          description: 'Registration deadline must be before the event date'
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // Add registration_required as true since it's always required now
      const eventData = {
        ...formData,
        registration_required: true
      }

      const response = await apiService.createEvent(eventData)

      if (response.success) {
        toast.success('Event Created! 🎉', {
          description: 'It has been sent for admin approval.'
        })
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        toast.error('Creation Failed', {
          description: response.error || 'Failed to create event'
        })
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Error', {
        description: 'Error creating event. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="create-event" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex items-center text-sm font-medium text-slate-500 hover:text-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Create New Event
          </h1>
          <p className="text-lg text-slate-500">
            Design an engaging experience for your club members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">

            {/* Section: Basic Info */}
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Event Details
              </h3>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Annual Tech Symposium 2024"
                    required
                    className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell people what this event is about..."
                    rows={4}
                    required
                    className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="event_type" className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                    <div className="relative">
                      <select
                        id="event_type"
                        name="event_type"
                        value={formData.event_type}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none cursor-pointer font-medium"
                      >
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500">
                        <Type className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="club_id" className="block text-sm font-semibold text-slate-700 mb-2">Organizing Club</label>
                    <div className="relative">
                      <input
                        type="text"
                        id="club_id"
                        value={userClub ? userClub.name : 'Loading...'}
                        disabled
                        className="block w-full px-4 py-3 rounded-xl bg-slate-100 border-transparent text-slate-500 font-medium cursor-not-allowed"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Logistics */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                Logistics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-full">
                  <label htmlFor="event_date" className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    id="event_date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="start_time" className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="end_time" className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="venue_id" className="block text-sm font-semibold text-slate-700 mb-2">Venue</label>
                <div className="relative">
                  <select
                    id="venue_id"
                    name="venue_id"
                    value={formData.venue_id}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="">Select a venue (Optional)</option>
                    {venues.map(venue => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name} • {venue.type} (Cap: {venue.capacity})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Registration */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                Capacity & Deadlines
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="max_participants" className="block text-sm font-semibold text-slate-700 mb-2">Max Participants</label>
                  <input
                    type="number"
                    id="max_participants"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="e.g. 100"
                    required
                    className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="registration_deadline" className="block text-sm font-semibold text-slate-700 mb-2">Deadline (Optional)</label>
                  <input
                    type="datetime-local"
                    id="registration_deadline"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="block w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
                className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-200/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create Event
                  </>
                )}
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  )
}