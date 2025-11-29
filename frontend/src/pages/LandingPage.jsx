import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, MapPin, ArrowRight, Shield, Zap, Heart, Award } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/logo-clean.png" alt="EventNexus" className="h-20 w-auto object-contain" />
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/admin/login"
                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin Portal
              </Link>
              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
              <Link
                to="/login"
                className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40">
          {/* Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-primary/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 border border-primary/20 shadow-sm animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              The Ultimate Campus Event Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight animate-fade-in-up animation-delay-100">
              Your University Life, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/80">
                Connected & Vibrant.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
              Discover events, join clubs, and book venues with ease. EventNexus is the central hub for everything happening on campus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-lg font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Join Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 text-lg font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need</h2>
              <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                Streamline your campus experience with powerful tools designed for students and organizers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="w-8 h-8 text-white" />,
                  color: "bg-blue-500",
                  title: "Event Management",
                  desc: "Create, manage, and track events effortlessly. Real-time updates and easy registration."
                },
                {
                  icon: <Users className="w-8 h-8 text-white" />,
                  color: "bg-violet-500",
                  title: "Club Communities",
                  desc: "Join clubs that match your interests. Connect with peers and grow your network."
                },
                {
                  icon: <MapPin className="w-8 h-8 text-white" />,
                  color: "bg-pink-500",
                  title: "Venue Booking",
                  desc: "Seamlessly book campus venues for your events. Check availability and reserve instantly."
                }
              ].map((feature, idx) => (
                <div key={idx} className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: "Active Students", value: "2,000+" },
                { label: "Events Hosted", value: "500+" },
                { label: "Clubs", value: "50+" },
                { label: "Venues", value: "20+" }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary/80 to-primary/80 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="/logo-clean.png" alt="EventNexus" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} EventNexus. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <Heart className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                <Award className="w-5 h-5" />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
