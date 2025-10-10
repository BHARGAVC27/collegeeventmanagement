import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LandingPage from './LandingPage'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'
import DashboardPage from './DashboardPage'
import EventsPage from './EventsPage'
import EventRegister from './EventRegister'
import ClubsPage from './ClubsPage'
import ClubDetails from './ClubDetails'
import MyEvents from './MyEvents'
import AdminLoginPage from './AdminLoginPage'
import AdminDashboard from './AdminDashboard'
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
