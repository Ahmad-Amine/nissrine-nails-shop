import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, Ban, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { LoadingPage, ErrorMessage, EmptyState } from '../components/LoadingSpinner'
import { format } from 'date-fns'
import './DashboardPage.css'

const STATUS = {
  pending:   { label:'Pending Confirmation', icon:AlertCircle,  cls:'badge-pending',   desc:'Your appointment is waiting for the salon to confirm.' },
  confirmed: { label:'Confirmed ✅',         icon:CheckCircle2, cls:'badge-confirmed',  desc:'Your appointment is confirmed! See you soon 💅' },
  rejected:  { label:'Not Available ❌',     icon:XCircle,      cls:'badge-rejected',   desc:'This slot was unavailable. Please book another time.' },
  cancelled: { label:'Cancelled',            icon:Ban,          cls:'badge-cancelled',  desc:'This appointment was cancelled.' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [filter,       setFilter]       = useState('all')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await appointmentsAPI.getMine()
      setAppointments(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your appointments.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await appointmentsAPI.cancel(id)
      setAppointments(prev => prev.map(a => a._id===id ? {...a,status:'cancelled'} : a))
      toast.success('Appointment cancelled.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel. Please try again.')
    }
  }

  const filtered = filter==='all' ? appointments : appointments.filter(a => a.status===filter)
  const counts   = {
    pending:   appointments.filter(a=>a.status==='pending').length,
    confirmed: appointments.filter(a=>a.status==='confirmed').length,
    rejected:  appointments.filter(a=>a.status==='rejected').length,
  }

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div className="dash-header-orb"/>
        <div className="dash-header-content">
          <div className="dash-avatar">{user.name.charAt(0).toUpperCase()}</div>
          <div>
            <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
            <p>{user.email} · {user.phone}</p>
          </div>
        </div>
        <div className="dash-header-actions">
          <Link to="/book" className="btn btn-primary btn-sm"><Plus size={15}/> New Booking</Link>
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{animation:loading?'spin 0.8s linear infinite':'none'}}/> Refresh
          </button>
        </div>
      </div>

      <div className="dash-body">
        {/* Summary cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <CalendarDays size={22} className="sc-icon"/>
            <div><strong>{appointments.length}</strong><span>Total Bookings</span></div>
          </div>
          <div className="summary-card pending-card">
            <AlertCircle size={22} className="sc-icon"/>
            <div><strong>{counts.pending}</strong><span>Pending</span></div>
          </div>
          <div className="summary-card confirmed-card">
            <CheckCircle2 size={22} className="sc-icon"/>
            <div><strong>{counts.confirmed}</strong><span>Confirmed</span></div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="dash-tabs">
          {['all','pending','confirmed','rejected','cancelled'].map(f => (
            <button key={f} className={`dash-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
              {f!=='all' && appointments.filter(a=>a.status===f).length > 0 &&
                <span className="tab-count">{appointments.filter(a=>a.status===f).length}</span>
              }
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="dash-loading"><div className="spinner"/><p>Loading your appointments...</p></div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={load}/>
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📋"
            title={filter==='all' ? 'No bookings yet' : `No ${filter} appointments`}
            subtitle={filter==='all' ? 'Book your first appointment to get started!' : ''}
            action={filter==='all' && <Link to="/book" className="btn btn-primary" style={{marginTop:'16px'}}>Book Now →</Link>}
          />
        ) : (
          <div className="appt-list">
            {filtered.map((appt, i) => {
              const st     = STATUS[appt.status] || STATUS.pending
              const Icon   = st.icon
              const isPast = new Date(appt.date+'T23:59') < new Date()
              return (
                <div key={appt._id} className={`appt-item fade-up ${isPast?'past':''} status-${appt.status}`} style={{animationDelay:`${i*0.06}s`}}>
                  <div className="appt-status-bar"/>
                  <div className="appt-content">
                    <div className="appt-top">
                      <div className="appt-service-info">
                        <h3>{appt.service?.name || 'Service'}</h3>
                        <span className="appt-cat">{appt.service?.category}</span>
                      </div>
                      <span className={`badge ${st.cls}`}><Icon size={13}/> {st.label}</span>
                    </div>

                    <div className="appt-meta">
                      <div className="meta-chip"><CalendarDays size={13}/>{format(new Date(appt.date+'T00:00'),'EEE, MMM d, yyyy')}</div>
                      <div className="meta-chip"><Clock size={13}/>{appt.time}</div>
                      <div className="meta-chip">💰 ${appt.service?.price}</div>
                      <div className="meta-chip">⏱ {appt.service?.duration} min</div>
                    </div>

                    <div className={`appt-status-msg msg-${appt.status}`}>
                      <Icon size={15}/> {st.desc}
                    </div>

                    {appt.adminNote && (
                      <div className="appt-admin-note">
                        <strong>Note from salon:</strong> {appt.adminNote}
                      </div>
                    )}
                    {appt.notes && <div className="appt-notes">📝 Your note: {appt.notes}</div>}

                    {(appt.status==='pending'||appt.status==='confirmed') && !isPast && (
                      <div className="appt-actions">
                        <button className="btn-danger" onClick={()=>cancel(appt._id)}>Cancel Appointment</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
