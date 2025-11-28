import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import { Calendar, MapPin, Clock, Users, Upload, CheckCircle, AlertCircle, ArrowLeft, Building2 } from 'lucide-react'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function EventRegister() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)

  // Form data with user info pre-filled
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    paymentScreenshot: null
  })

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await apiService.getEvents()
        if (response.success) {
          const foundEvent = response.events.find(e => e.id === parseInt(eventId))
          if (foundEvent) {
            setEvent(foundEvent)
          } else {
            setError('Event not found')
          }
        }
      } catch (err) {
        console.error('Failed to fetch event:', err)
        setError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  // Pre-fill form with user data from token/localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}')
      setFormData(prev => ({
        ...prev,
        name: userInfo.name || '',
        email: userInfo.email || '',
        phone: userInfo.phone || ''
      }))
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB')
        return
      }

      setPaymentScreenshot(file)
      setFormData(prev => ({
        ...prev,
        paymentScreenshot: file
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields')
      }

      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        paymentScreenshot: paymentScreenshot ? paymentScreenshot.name : null
      }

      const response = await apiService.registerForEvent(eventId, registrationData)

      if (response.success) {
        const isReRegistration = response.message && response.message.toLowerCase().includes('re-registered')

        if (isReRegistration) {
          toast.success('Welcome Back! 🎉', {
            description: 'You have successfully re-registered for this event.',
            duration: 3000,
          })
        } else {
          toast.success(`Successfully registered for ${response.registration.eventName}!`, {
            description: `Status: ${response.registration.status}`,
            duration: 3000,
          })
        }

        setTimeout(() => {
          navigate('/events')
        }, 2500)
      } else {
        if (response.status === 400) {
          toast.warning('Already Registered', {
            description: response.error || 'You have already registered for this event.',
            duration: 3000,
          })
          setTimeout(() => {
            navigate('/events')
          }, 2500)
        } else if (response.status === 404) {
          toast.error('Event Not Found', {
            description: response.error || 'The event you are trying to register for could not be found.',
            duration: 3000,
          })
        } else {
          throw new Error(response.error || 'Failed to register for the event')
        }
      }
    } catch (err) {
      console.error('Failed to register:', err)
      const errorMessage = err.message || 'Failed to register for the event. Please try again.'
      setError(errorMessage)
      toast.error('Registration Failed', {
        description: errorMessage,
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md w-full text-center border border-red-100">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Event</h2>
          <p className="mb-6">{error || 'Event not found'}</p>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="events" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 group font-medium"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </button>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Event Card */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-indigo-500/10">
              <div className="relative h-64 sm:h-80">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                <img
                  src={event.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.name)}&background=random&size=400`}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.name)}&background=random&size=400`
                  }}
                />
                <div className="absolute top-4 right-4 z-20">
                  <span className="px-4 py-1.5 rounded-full bg-green-500/90 backdrop-blur-sm text-white text-sm font-bold shadow-sm flex items-center gap-1.5 border border-white/20">
                    <CheckCircle className="w-4 h-4" />
                    Approved
                  </span>
                </div>
                <div className="absolute bottom-6 left-6 z-20">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 leading-tight">{event.name}</h1>
                  <p className="text-white/90 text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Hosted by {event.club_name}
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-0.5">Date</p>
                      <p className="font-semibold text-slate-900">{apiService.formatEventDate(event.event_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-0.5">Time</p>
                      <p className="font-semibold text-slate-900">{apiService.formatEventTime(event.start_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-0.5">Venue</p>
                      <p className="font-semibold text-slate-900">{event.venue_name || 'TBA'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-0.5">Availability</p>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{event.registered_count || 0} registered</span>
                        {event.max_participants && (
                          <span className="text-sm text-slate-500">/ {event.max_participants} max</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {event.max_participants && event.registered_count >= event.max_participants && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3 text-orange-700">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">This event is currently full. Registering now will add you to the waitlist.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg shadow-slate-200/50">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Secure Your Spot</h2>
              <p className="text-slate-500">Fill in your details below to complete your registration.</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-slate-700 ml-1">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 ml-1">Payment Screenshot (Optional)</label>
                <div className="relative">
                  <input
                    type="file"
                    id="paymentScreenshot"
                    name="paymentScreenshot"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="paymentScreenshot"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${paymentScreenshot
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className={`w-8 h-8 mb-2 ${paymentScreenshot ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <p className="text-sm text-slate-500 text-center px-4">
                        {paymentScreenshot ? (
                          <span className="text-indigo-600 font-medium">{paymentScreenshot.name}</span>
                        ) : (
                          <span>Click to upload screenshot</span>
                        )}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-8"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm Registration
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
