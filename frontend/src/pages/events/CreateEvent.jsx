import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle, Type, FileText, Building2, Save, X } from 'lucide-react'
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="create-event" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create New Event</h1>
          <p className="text-slate-500">
            Fill in the details below to create your event. It will be sent to admin for approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Basic Information
            </h3>

            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Event Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter event name"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your event..."
                  rows={4}
                  required
                  className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="event_type" className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                  <select
                    id="event_type"
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="club_id" className="block text-sm font-medium text-slate-700 mb-1">Organizing Club *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="club_id"
                      value={userClub ? userClub.name : 'Loading...'}
                      disabled
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed shadow-sm"
                      title="Club is automatically selected based on your club head role"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Date and Time Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Date & Time
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-slate-700 mb-1">Event Date *</label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    step="300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    step="300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Venue Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Venue
            </h3>

            <div>
              <label htmlFor="venue_id" className="block text-sm font-medium text-slate-700 mb-1">Venue (Optional)</label>
              <select
                id="venue_id"
                name="venue_id"
                value={formData.venue_id}
                onChange={handleInputChange}
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
              >
                <option value="">Select Venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.type} (Capacity: {venue.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registration Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Registration Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-slate-700 mb-1">Max Participants *</label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter max participants"
                  required
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <div>
                <label htmlFor="registration_deadline" className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  id="registration_deadline"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="block w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </main>
    </div>
  )
}