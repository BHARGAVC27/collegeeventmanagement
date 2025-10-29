import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './styles/App.css'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/events/EventsPage'
import CreateEvent from './pages/events/CreateEvent'
import EventRegister from './pages/events/EventRegister'
import ClubsPage from './pages/clubs/ClubsPage'
import ClubDetails from './pages/clubs/ClubDetails'
import ManageClub from './pages/clubs/ManageClub'
import MyEvents from './pages/events/MyEvents'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  console.log('App component rendering');
  
  const isAuthenticated = () => {
    return localStorage.getItem('token') && localStorage.getItem('user');
  };
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } 
      />
      <Route 
        path="/register" 
        element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events" 
        element={
          <ProtectedRoute>
            <EventsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-event" 
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/events/:eventId/register" 
        element={
          <ProtectedRoute>
            <EventRegister />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clubs" 
        element={
          <ProtectedRoute>
            <ClubsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clubs/:clubId" 
        element={
          <ProtectedRoute>
            <ClubDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/clubs/:clubId/manage" 
        element={
          <ProtectedRoute>
            <ManageClub />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-events" 
        element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
