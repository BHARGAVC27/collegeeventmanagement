import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, ArrowRight, Shield, MapPin, Mail, UserPlus } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import apiService from '../../services/apiService'
import NavBar from '../../components/NavBar'

export default function ClubsPage() {
  const navigate = useNavigate()
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [joiningClubId, setJoiningClubId] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
    fetchClubs()
  }, [])

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const response = await apiService.getClubs()
      if (response.success) {
        setClubs(response.clubs || [])
      }
    } catch (err) {
      console.error('Error fetching clubs:', err)
      toast.error('Error', { description: 'Failed to load clubs.' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClub = async (e, clubId, clubName) => {
    e.stopPropagation() // Prevent card click

    if (!user || !user.email) {
      toast.error('Login Required', { description: 'Please log in to join a club' })
      return
    }

    try {
      setJoiningClubId(clubId)
      const response = await apiService.joinClub(clubId, user.email)

      if (response.success) {
        toast.success('Club Joined! 🎉', {
          description: `Successfully joined ${clubName}!`
        })
        fetchClubs() // Refresh to update member counts
      } else {
        toast.error('Join Failed', {
          description: response.error || 'Failed to join club'
        })
      }
    } catch (err) {
      console.error('Failed to join club:', err)
      toast.error('Error', {
        description: err.message || 'Failed to join club. Please try again.'
      })
    } finally {
      setJoiningClubId(null)
    }
  }

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get club image based on name (placeholder logic)
  const getClubImage = (clubName) => {
    const lowerName = clubName.toLowerCase()
    if (lowerName.includes('coding') || lowerName.includes('tech')) {
      return 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop'
    } else if (lowerName.includes('music')) {
      return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop'
    } else if (lowerName.includes('sport')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop'
    }
    return 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop'
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <Toaster position="top-right" richColors closeButton />
      <NavBar activePage="clubs" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Student Clubs</h1>
            <p className="text-slate-500 max-w-2xl">
              Discover and join communities that match your interests. Connect, learn, and grow together.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No clubs found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClubs.map(club => (
              <div
                key={club.id}
                onClick={() => navigate(`/clubs/${club.id}`)}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full"
              >
                {/* Card Image */}
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
                  <img
                    src={getClubImage(club.name)}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <h3 className="text-xl font-bold text-white mb-1 truncate">{club.name}</h3>
                    <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                      <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <Users className="w-3 h-3" />
                        {club.member_count || 0} Members
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-slate-600 text-sm line-clamp-2 mb-6 flex-1">
                    {club.description || 'No description available.'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      <span className="truncate">Head: {club.head_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span className="truncate">{club.campus_name || 'Main Campus'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                    <button
                      onClick={(e) => handleJoinClub(e, club.id, club.name)}
                      disabled={joiningClubId === club.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors disabled:opacity-70"
                    >
                      {joiningClubId === club.id ? (
                        <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Join
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
