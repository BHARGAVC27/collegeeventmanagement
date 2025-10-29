import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'
import './CreateEvent.css'

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
      alert('Access denied. Only club heads can create events.')
      navigate('/dashboard')
      return
    }

    fetchInitialData()
  }, [navigate])

  const fetchInitialData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      console.log('Current user:', user)
      
      // Fetch venues
      const venuesResponse = await apiService.getVenues()
      if (venuesResponse.success) {
        setVenues(venuesResponse.venues || [])
      }

      // Fetch user's clubs to find which club they are head of
      const clubsResponse = await apiService.getClubs()
      console.log('Clubs response:', clubsResponse)
      
      if (clubsResponse.success) {
        const clubs = clubsResponse.clubs || []
        console.log('All clubs:', clubs)
        
        // Find the club where current user is the head
        const myClub = clubs.find(club => {
          console.log(`Checking club ${club.name}: club_head_id=${club.club_head_id}, user.id=${user.id}`)
          return club.club_head_id === user.id || club.club_head_email === user.email
        })
        
        console.log('My club:', myClub)
        
        if (myClub) {
          setUserClub(myClub)
          // Automatically set the club_id in form
          setFormData(prev => ({
            ...prev,
            club_id: myClub.id.toString()
          }))
        } else {
          alert('You are not assigned as head of any club. Please contact admin.')
          navigate('/dashboard')
        }
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
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
      alert(`Please fill in all required fields: ${missing.join(', ')}`)
      return false
    }

    // Validate max_participants is a positive number
    if (parseInt(formData.max_participants) <= 0) {
      alert('Max participants must be greater than 0')
      return false
    }

    // Validate date is not in the past
    const eventDate = new Date(formData.event_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      alert('Event date cannot be in the past')
      return false
    }

    // Validate time order
    if (formData.start_time >= formData.end_time) {
      alert('Start time must be before end time')
      return false
    }

    // Validate registration deadline if provided
    if (formData.registration_deadline) {
      const regDeadline = new Date(formData.registration_deadline)
      if (regDeadline > eventDate) {
        alert('Registration deadline must be before the event date')
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
        alert('Event created successfully! It has been sent for admin approval.')
        navigate('/dashboard')
      } else {
        alert(response.error || 'Failed to create event')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error creating event. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-event-page">
      <NavBar activePage="create-event" />
      
      <div className="create-event-container">
        <div className="create-event-header">
          <h1>Create New Event</h1>
          <p>Fill in the details below to create your event. It will be sent to admin for approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="create-event-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Event Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter event name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your event"
                rows={4}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event_type">Event Type</label>
                <select
                  id="event_type"
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleInputChange}
                >
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="club_id">Organizing Club *</label>
                <input
                  type="text"
                  id="club_id"
                  value={userClub ? userClub.name : 'Loading...'}
                  disabled
                  className="disabled-input"
                  title="Club is automatically selected based on your club head role"
                />
              </div>
            </div>
          </div>

          {/* Date and Time Section */}
          <div className="form-section">
            <h3>Date & Time</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="event_date">Event Date * <small>(Click to open calendar)</small></label>
                <input
                  type="date"
                  id="event_date"
                  name="event_date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="date-picker"
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_time">Start Time * <small>(Click to select time)</small></label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="time-picker"
                  step="300"
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time">End Time * <small>(Click to select time)</small></label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="time-picker"
                  step="300"
                />
              </div>
            </div>
          </div>

          {/* Venue Section */}
          <div className="form-section">
            <h3>Venue</h3>
            
            <div className="form-group">
              <label htmlFor="venue_id">Venue (Optional)</label>
              <select
                id="venue_id"
                name="venue_id"
                value={formData.venue_id}
                onChange={handleInputChange}
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
          <div className="form-section">
            <h3>Registration Settings</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="max_participants">Max Participants * <small>(Required for all events)</small></label>
                <input
                  type="number"
                  id="max_participants"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter maximum number of participants"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="registration_deadline">Registration Deadline (Optional) <small>(Click to select date & time)</small></label>
                <input
                  type="datetime-local"
                  id="registration_deadline"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="datetime-picker"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}