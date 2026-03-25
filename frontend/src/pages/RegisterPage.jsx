import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [showPw,    setShowPw]    = useState(false)
  const [showCPw,   setShowCPw]   = useState(false)
  const [loading,   setLoading]   = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Live password match indicator
  const pwMatch  = form.confirmPassword.length > 0 && form.password === form.confirmPassword
  const pwNoMatch= form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword)
      { toast.error('Please fill in all fields'); return }

    if (form.password.length < 6)
      { toast.error('Password must be at least 6 characters'); return }

    if (form.password !== form.confirmPassword)
      { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { confirmPassword, ...payload } = form
      const res = await authAPI.register(payload)
      login(res.data.token, res.data.user)
      toast.success(`Welcome, ${res.data.user.name.split(' ')[0]}! 💅`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-emoji">🌸</span>
          <h2>Join Us Today</h2>
          <p>Create an account to book appointments and track your nail care journey.</p>
          <div className="auth-features">
            <div className="af-item">💅 Book appointments online 24/7</div>
            <div className="af-item">✅ Get instant booking confirmations</div>
            <div className="af-item">📋 View all your bookings in one place</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={set('name')}
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+961 71 234 567"
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className={`pw-wrap ${pwMatch ? 'pw-match' : ''} ${pwNoMatch ? 'pw-nomatch' : ''}`}>
                <input
                  type={showCPw ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowCPw(s => !s)}>
                  {showCPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
                {pwMatch   && <CheckCircle size={16} className="pw-check-icon match"/>}
              </div>
              {pwNoMatch && <p className="pw-error">Passwords do not match</p>}
              {pwMatch   && <p className="pw-ok">Passwords match ✓</p>}
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading
                ? <div className="spinner spinner-sm"/>
                : <><UserPlus size={16}/> Create Account</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
