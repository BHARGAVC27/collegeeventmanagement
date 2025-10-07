import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate, useParams } from 'react-router-dom'
import apiService from './services/apiService'
import NavBar from './components/NavBar'

export default function ClubDetails() {
  const { clubId } = useParams()
  const { isLoaded } = useUser()
  const navigate = useNavigate()
  const [club, setClub] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch club details and members
  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true)
        
        // Fetch club details
        const clubResponse = await apiService.getClubById(clubId)
        if (clubResponse.success) {
          setClub(clubResponse.club)
        }
        
        // Fetch club members
        const membersResponse = await apiService.getClubMembers(clubId)
        if (membersResponse.success) {
          setMembers(membersResponse.members)
        }
        
      } catch (err) {
        console.error('Failed to fetch club data:', err)
        setError('Failed to load club details')
      } finally {
        setLoading(false)
      }
    }

    if (isLoaded && clubId) {
      fetchClubData()
    }
  }, [isLoaded, clubId])

  // Get club image based on name (same logic as ClubsPage)
  const getClubImage = (clubName) => {
    if (!clubName) return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop'
    
    const lowerName = clubName.toLowerCase()
    if (lowerName.includes('coding') || lowerName.includes('tech') || lowerName.includes('computer')) {
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop'
    } else if (lowerName.includes('debate') || lowerName.includes('speaking')) {
      return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&h=400&fit=crop'
    } else if (lowerName.includes('photo') || lowerName.includes('camera')) {
      return 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop'
    } else if (lowerName.includes('music') || lowerName.includes('band')) {
      return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop'
    } else if (lowerName.includes('art') || lowerName.includes('design')) {
      return 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop'
    } else if (lowerName.includes('sport') || lowerName.includes('fitness')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop'
    }
    return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop'
  }

  if (!isLoaded || loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="dashboard-container">
        <NavBar activePage="clubs" />
        <div className="error-container">
          <p className="error-message">{error || 'Club not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/clubs')}>
            Back to Clubs
          </button>
        </div>
      </div>
    )
  }

  const clubHead = members.find(m => m.role === 'Head')
  const regularMembers = members.filter(m => m.role !== 'Head')

  return (
    <div className="dashboard-container">
      <NavBar activePage="clubs" />

      <main className="club-details-main">
        {/* Club Header Section */}
        <div className="club-details-header">
          <button className="back-button" onClick={() => navigate('/clubs')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Clubs
          </button>

          <div className="club-header-content">
            <div className="club-header-image-wrapper">
              <img
                src={getClubImage(club.name)}
                alt={club.name}
                className="club-header-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234a5568" width="400" height="400"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + club.name + '%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>

            <div className="club-header-info">
              <h1 className="club-details-title">{club.name}</h1>
              <p className="club-details-description">{club.description}</p>
              
              <div className="club-header-stats">
                <div className="stat-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <div>
                    <span className="stat-value">{members.length}</span>
                    <span className="stat-label">Total Members</span>
                  </div>
                </div>

                {club.faculty_coordinator && (
                  <div className="stat-item">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div>
                      <span className="stat-value">{club.faculty_coordinator}</span>
                      <span className="stat-label">Faculty Coordinator</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Club Head Section */}
        {clubHead && (
          <div className="club-section">
            <h2 className="section-title">Club Head</h2>
            <div className="club-head-card">
              <div className="member-avatar">
                {clubHead.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-info">
                <h3 className="member-name">{clubHead.name}</h3>
                <p className="member-id">Student ID: {clubHead.student_id}</p>
                <p className="member-email">{clubHead.email}</p>
              </div>
              <div className="member-role-badge head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                Club Head
              </div>
            </div>
          </div>
        )}

        {/* Club Members Section */}
        <div className="club-section">
          <h2 className="section-title">
            Club Members {regularMembers.length > 0 && `(${regularMembers.length})`}
          </h2>
          
          {regularMembers.length > 0 ? (
            <div className="members-grid">
              {regularMembers.map((member, index) => (
                <div key={member.id} className="member-card">
                  <div className="member-number">{index + 1}</div>
                  <div className="member-avatar">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-id">Student ID: {member.student_id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-members">
              <p>No members yet. Be the first to join!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
