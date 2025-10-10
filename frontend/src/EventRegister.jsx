import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import apiService from './services/apiService'
import NavBar from './components/NavBar'

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
      // You can fetch user profile or get basic info from localStorage
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
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }

      // Validate file size (max 5MB)
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
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields')
      }

      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        paymentScreenshot: paymentScreenshot ? paymentScreenshot.name : null
      }

      console.log('Registering for event:', {
        eventId,
        ...registrationData
      })

      // Call the API to register for the event
      const response = await apiService.registerForEvent(eventId, registrationData)

      if (response.success) {
        // Check if this is a re-registration (message contains "re-registered")
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
        // Handle different error cases
        if (response.status === 400) {
          // Already registered or validation error
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
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="page-root">
        <div className="error-container">
          <p className="error-message">{error || 'Event not found'}</p>
          <button className="btn primary" onClick={() => navigate('/events')}>
            Back to Events
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-root">
      <Toaster position="top-right" richColors closeButton />
      {/* Navigation Bar */}
      <NavBar activePage="events" />

      {/* Event Registration Content */}
      <div className="event-register-container">
        {/* Left Side - Event Card */}
        <div className="event-register-left">
        <div className="event-register-card">
          <div className="event-card-image">
            <img 
              src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=500&h=400&fit=crop" 
              alt={event.name}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%236366f1" width="400" height="300"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EEvent Image%3C/text%3E%3C/svg%3E'
              }}
            />
            <div className="event-status-badge">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#10B981"/>
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Approved</span>
            </div>
          </div>
          
          <div className="event-card-content">
            <h2 className="event-card-title">{event.name}</h2>
            
            <div className="event-card-details">
              <div className="event-detail-item">
                <svg className="event-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{apiService.formatEventDate(event.event_date)}, {apiService.formatEventTime(event.start_time)}</span>
              </div>
              
              <div className="event-detail-item">
                <svg className="event-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{event.venue_name || 'Central Quad'}</span>
              </div>
              
              <div className="event-detail-item">
                <svg className="event-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Hosted by {event.club_name || 'Music Society'}</span>
              </div>
            </div>

            <div className="event-registration-count">
              <svg className="event-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="registration-number">{event.registered_count || 0}</span>
              <span className="registration-label">
                Going
                {event.max_participants && (
                  <span className="max-capacity"> / {event.max_participants} max</span>
                )}
              </span>
            </div>
            
            {event.max_participants && event.registered_count >= event.max_participants && (
              <div className="event-full-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>This event is full. You will be added to the waitlist.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="event-register-right">
        <div className="register-form-container">
          <h1 className="register-title">Register for Event</h1>
          <p className="register-subtitle">Fill in your details to register for this event</p>

          {error && (
            <div className="error-banner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentScreenshot">Upload Payment Screenshot</label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  id="paymentScreenshot"
                  name="paymentScreenshot"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="paymentScreenshot" className="file-upload-label">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>{paymentScreenshot ? paymentScreenshot.name : 'Upload payment screenshot'}</span>
                </label>
              </div>
              {paymentScreenshot && (
                <p className="file-name">Selected: {paymentScreenshot.name}</p>
              )}
            </div>

            <button 
              type="submit" 
              className="register-submit-btn"
              disabled={submitting}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
    </div>
  )
}
