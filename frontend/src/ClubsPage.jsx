import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from './services/apiService'
import NavBar from './components/NavBar'

export default function ClubsPage() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [joiningClub, setJoiningClub] = useState(null)

  // Fetch all clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true)
        const response = await apiService.getClubs()
        if (response.success) {
          setClubs(response.clubs)
        }
      } catch (err) {
        console.error('Failed to fetch clubs:', err)
        setError('Failed to load clubs')
      } finally {
        setLoading(false)
      }
    }

    fetchClubs()
  }, [])

  const handleJoinClub = async (clubId, clubName) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please log in to join a club')
      navigate('/login')
      return
    }

    setJoiningClub(clubId)
    try {
      const response = await apiService.joinClub(clubId)

      if (response.success) {
        alert(`Successfully joined ${clubName}!`)
        // Refresh clubs to update member count
        const refreshResponse = await apiService.getClubs()
        if (refreshResponse.success) {
          setClubs(refreshResponse.clubs)
        }
      } else {
        alert(response.error || 'Failed to join club')
      }
    } catch (err) {
      console.error('Failed to join club:', err)
      alert(err.message || 'Failed to join club. Please try again.')
    } finally {
      setJoiningClub(null)
    }
  }

  // Get club image based on name (placeholder logic)
  const getClubImage = (clubName) => {
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

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <NavBar activePage="clubs" />

      <main className="clubs-main">
        <div className="clubs-header">
          <h1 className="clubs-title">Clubs & Organizations</h1>
          <p className="clubs-subtitle">Find your community.</p>
        </div>

        {error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        ) : (
          <div className="clubs-grid">
            {clubs.length > 0 ? (
              clubs.map((club) => {
                // For now, we'll check if user is club head using localStorage
                const userEmail = JSON.parse(localStorage.getItem('user') || '{}').email
                const isUserHead = userEmail === club.head_email
                
                return (
                  <div 
                    key={club.id} 
                    className="club-card"
                    onClick={() => navigate(`/clubs/${club.id}`)}
                  >
                    <div className="club-image-wrapper">
                      <img
                        src={getClubImage(club.name)}
                        alt={club.name}
                        className="club-image"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%234a5568" width="400" height="400"/%3E%3Ctext fill="%23ffffff" font-family="Arial" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E' + club.name + '%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </div>

                    <h3 className="club-name">{club.name}</h3>
                    <p className="club-description">{club.description}</p>

                    <div className="club-info">
                      <div className="club-info-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span className="club-members">{club.member_count || 0}</span>
                        <span className="club-members-label">Members</span>
                      </div>

                      {club.head_name && (
                        <div className="club-info-item">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span className="club-head">{club.head_name.split(' ')[0]}</span>
                          <span className="club-head-label">{club.head_name.split(' ').slice(1).join(' ')}</span>
                        </div>
                      )}
                    </div>

                    <button
                      className={`club-action-btn ${isUserHead ? 'manage' : 'join'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        isUserHead ? navigate(`/clubs/${club.id}/manage`) : handleJoinClub(club.id, club.name)
                      }}
                      disabled={joiningClub === club.id}
                    >
                      {isUserHead ? (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Manage Club
                        </>
                      ) : (
                        <>
                          {joiningClub === club.id ? 'Joining...' : 'Join Club'}
                        </>
                      )}
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="no-clubs">
                <p>No clubs found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
