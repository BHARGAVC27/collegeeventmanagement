import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

export default function SSOCallback() {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // User is signed in, redirect to dashboard
        navigate('/dashboard', { replace: true })
      } else {
        // User is not signed in, redirect to login
        navigate('/login', { replace: true })
      }
    }
  }, [isSignedIn, isLoaded, navigate])

  return (
    <div className="page-root">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Completing Sign In...</h1>
          <p>Please wait while we finish signing you in.</p>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  )
}