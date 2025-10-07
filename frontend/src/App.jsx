import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
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
import SSOCallback from './SSOCallback'

function App() {
  console.log('App component rendering');
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* SSO Callback route */}
      <Route path="/sso-callback" element={<SSOCallback />} />
      
      {/* Auth routes */}
      <Route 
        path="/login" 
        element={
          <>
            <SignedOut>
              <LoginPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        } 
      />
      <Route 
        path="/register" 
        element={
          <>
            <SignedOut>
              <RegisterPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <>
            <SignedIn>
              <DashboardPage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/events" 
        element={
          <>
            <SignedIn>
              <EventsPage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/events/:eventId/register" 
        element={
          <>
            <SignedIn>
              <EventRegister />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/clubs" 
        element={
          <>
            <SignedIn>
              <ClubsPage />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/clubs/:clubId" 
        element={
          <>
            <SignedIn>
              <ClubDetails />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
      <Route 
        path="/my-events" 
        element={
          <>
            <SignedIn>
              <MyEvents />
            </SignedIn>
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          </>
        } 
      />
    </Routes>
  )
}

export default App
