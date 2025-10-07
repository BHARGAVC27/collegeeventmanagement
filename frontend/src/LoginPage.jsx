import React from 'react'
import { SignIn } from '@clerk/clerk-react'

export default function LoginPage() {
  console.log('LoginPage rendering');
  
  return (
    <div className="page-root">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your EventNexus account</p>
        </div>
        <div className="clerk-auth-wrapper">
          <SignIn 
            signUpUrl="/register"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary-color hover:bg-primary-color/90 text-white",
                card: "shadow-lg border border-gray-200",
                headerTitle: "text-primary-text",
                headerSubtitle: "text-secondary-text",
                socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50",
                formFieldInput: "border border-gray-300 focus:border-primary-color focus:ring-1 focus:ring-primary-color",
                footerActionLink: "text-primary-color hover:text-primary-color/80"
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}