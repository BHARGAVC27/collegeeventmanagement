import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calendar, Users, CalendarCheck, PlusCircle, LogOut, User } from 'lucide-react'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Determine active page based on path
  const getActivePage = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'dashboard'
    if (path === '/events') return 'events'
    if (path === '/clubs') return 'clubs'
    if (path === '/my-events') return 'my-events'
    if (path === '/create-event') return 'create-event'
    return ''
  }

  const activePage = getActivePage()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    navigate('/')
  }

  const isClubHead = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const userType = localStorage.getItem('userType')
    return userType === 'student' && user.role?.includes('club_head')
  }

  const NavButton = ({ path, icon: Icon, label, activeId }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 
        ${activePage === activeId
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <div
          onClick={() => navigate('/dashboard')}
          className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
        >
          <img src="/logo-clean.png" alt="EventNexus" className="h-16 object-contain" />
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-full border border-slate-200">
        <NavButton path="/dashboard" icon={LayoutDashboard} label="Dashboard" activeId="dashboard" />
        <NavButton path="/events" icon={Calendar} label="Events" activeId="events" />
        <NavButton path="/clubs" icon={Users} label="Clubs" activeId="clubs" />
        <NavButton path="/my-events" icon={CalendarCheck} label="My Events" activeId="my-events" />
      </div>

      <div className="flex items-center gap-4">
        {isClubHead() && (
          <button
            onClick={() => navigate('/create-event')}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 
              ${activePage === 'create-event'
                ? 'bg-primary/10 text-primary'
                : 'bg-gradient-to-r from-primary to-primary text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5'
              }`}
          >
            <PlusCircle size={18} />
            <span>Create Event</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={14} />
            </div>
            <span className="text-sm font-medium text-slate-700">Profile</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  )
}
