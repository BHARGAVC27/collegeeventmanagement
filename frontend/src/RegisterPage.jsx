import React from 'react'
import { SignUp } from '@clerk/clerk-react'

export default function RegisterPage() {
  console.log('RegisterPage rendering');
  
  return (
    <div className="page-root">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Join EventNexus</h1>
          <p>Create your account to get started</p>
        </div>
        <div className="clerk-auth-wrapper">
          <SignUp 
            signInUrl="/login"
            afterSignUpUrl="/dashboard"
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