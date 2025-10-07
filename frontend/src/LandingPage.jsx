import React from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="page-root">
      <nav className="navbar">
        <div className="brand">EventNexus</div>

        <div className="nav-actions">
          <Link className="login-link" to="/login">Login</Link>
          <Link className="btn primary" to="/register">Register<span className="arrow">→</span></Link>
        </div>
      </nav>

      <main className="hero">
        <h1 className="hero-title">
          Your University Life,
          <br />
          <span className="text-accent">Connected.</span>
        </h1>

        <p className="hero-sub">
          Discover events, join clubs, and book venues with ease. EventNexus is the central
          hub for everything happening on campus.
        </p>

        <div className="cta-wrap">
          <Link className="btn cta" to="/dashboard">Explore Events <span className="arrow">→</span></Link>
        </div>
      </main>
    </div>
  )
}
