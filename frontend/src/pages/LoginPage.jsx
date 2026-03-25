import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const from = location.state?.from || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      login(res.data.token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}! 💅`)
      navigate(res.data.user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-emoji">💅</span>
          <h2>Welcome Back</h2>
          <p>Log in to manage your appointments and see your booking status.</p>
          <div className="auth-features">
            <div className="af-item">✨ View appointment status instantly</div>
            <div className="af-item">📅 Book new appointments easily</div>
            <div className="af-item">💎 Track your beauty history</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <h1>Sign In</h1>
            <p>Don't have an account? <Link to="/register">Create one</Link></p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <><div className="spinner spinner-sm"/></> : <><LogIn size={16}/> Sign In</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
