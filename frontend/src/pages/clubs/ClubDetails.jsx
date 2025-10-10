import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function ClubDetails() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const [club, setClub] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (clubId) {
      fetchClubDetails()
    }
  }, [clubId])

  const fetchClubDetails = async () => {
    try {
      setLoading(true)
      const response = await apiService.getClubById(clubId)
      if (response.success) {
        setClub(response.club)
      }
    } catch (err) {
      console.error('Error fetching club details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-root">
        <NavBar activePage="clubs" />
        <main className="events-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading club details...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-root">
      <NavBar activePage="clubs" />
      <main className="events-main">
        <div className="events-container">
          <h1>{club?.name || 'Club Details'}</h1>
          <p>{club?.description || 'No description available'}</p>
        </div>
      </main>
    </div>
  )
}
