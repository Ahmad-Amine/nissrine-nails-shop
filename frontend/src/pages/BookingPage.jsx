import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, CheckCircle, Loader, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { availabilityAPI, servicesAPI, appointmentsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { LoadingPage, ErrorMessage } from '../components/LoadingSpinner'
import { format } from 'date-fns'
import './BookingPage.css'

const STEP_LABELS = ['Select Date & Time','Choose Service','Your Details','Review & Confirm']

export default function BookingPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const preId      = params.get('serviceId')

  const [step,            setStep]            = useState(0)
  const [monthData,       setMonthData]       = useState([])
  const [selectedDate,    setSelectedDate]    = useState(null)
  const [slots,           setSlots]           = useState([])
  const [selectedSlot,    setSelectedSlot]    = useState(null)
  const [services,        setServices]        = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [notes,           setNotes]           = useState('')
  const [loading,         setLoading]         = useState(true)
  const [loadError,       setLoadError]       = useState(null)
  const [slotsLoading,    setSlotsLoading]    = useState(false)
  const [slotsError,      setSlotsError]      = useState(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [booked,          setBooked]          = useState(false)

  const loadInitial = async () => {
    setLoading(true); setLoadError(null)
    try {
      const [avRes, svcRes] = await Promise.all([
        availabilityAPI.getMonth(),
        servicesAPI.getAll()
      ])
      setMonthData(avRes.data.data)
      const svcs = svcRes.data.data
      setServices(svcs)
      if (preId) {
        const found = svcs.find(s => s._id === preId)
        if (found) setSelectedService(found)
      }
    } catch (err) {
      setLoadError(err.response?.data?.message || 'Could not load booking page. Please check that the backend is running.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadInitial() }, [])

  const selectDate = async (dateStr) => {
    setSelectedDate(dateStr); setSelectedSlot(null)
    setSlotsLoading(true); setSlotsError(null)
    try {
      const res = await availabilityAPI.getSlots(dateStr)
      if (!res.data.isOpen) {
        setSlotsError(res.data.reason || 'The salon is closed on this day.')
        setSlots([])
      } else {
        setSlots(res.data.slots || [])
      }
    } catch (err) {
      setSlotsError(err.response?.data?.message || 'Could not load time slots.')
      setSlots([])
    } finally { setSlotsLoading(false) }
  }

  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      toast.error('Please complete all steps before confirming.'); return
    }
    setSubmitting(true)
    try {
      await appointmentsAPI.create({ serviceId: selectedService._id, date: selectedDate, time: selectedSlot, notes })
      setBooked(true)
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. Please try again.'
      toast.error(msg)
      // If slot just got taken, go back to date step
      if (err.response?.status === 409) { setStep(0); setSelectedSlot(null) }
    } finally { setSubmitting(false) }
  }

  const availColor = (item) => {
    if (!item.isOpen || item.availableSlots === 0) return 'unavail'
    if (item.availableSlots <= 2) return 'few'
    return 'free'
  }

  if (loading)   return <LoadingPage text="Loading availability..." />
  if (loadError) return <div style={{padding:'40px'}}><ErrorMessage message={loadError} onRetry={loadInitial}/></div>

  // Success screen
  if (booked) return (
    <div className="booking-success">
      <div className="success-card fade-up">
        <div className="success-icon">🎉</div>
        <h1>Appointment Booked!</h1>
        <p>Your request has been sent. Check your dashboard to track the confirmation status.</p>
        <div className="success-details">
          <div className="sd-row"><span>Name</span><strong>{user?.name}</strong></div>
          <div className="sd-row"><span>Service</span><strong>{selectedService?.name}</strong></div>
          <div className="sd-row"><span>Date</span><strong>{format(new Date(selectedDate+'T00:00'),'EEEE, MMMM d, yyyy')}</strong></div>
          <div className="sd-row"><span>Time</span><strong>{selectedSlot}</strong></div>
          <div className="sd-row"><span>Price</span><strong>${selectedService?.price}</strong></div>
        </div>
        <div className="success-actions">
          <button className="btn btn-primary" onClick={()=>navigate('/dashboard')}>View My Dashboard</button>
          <button className="btn btn-outline" onClick={()=>navigate('/')}>Back to Home</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="booking-page">
      {/* Header */}
      <div className="booking-header">
        <h1>Book Appointment</h1>
        <p>Choose your date, time, and service</p>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={`step ${i===step?'active':''} ${i<step?'done':''}`}>
            <div className="step-num">{i<step?<CheckCircle size={13}/>:i+1}</div>
            <span>{label}</span>
            {i < STEP_LABELS.length-1 && <div className="step-line"/>}
          </div>
        ))}
      </div>

      <div className="booking-body">
        {/* STEP 0: Date & Time */}
        {step === 0 && (
          <div className="step-panel fade-up">
            <h2>Select a Date</h2>
            <div className="legend">
              <span className="leg free"/>Available
              <span className="leg few"/>Few slots
              <span className="leg unavail"/>Closed / Full
            </div>

            <div className="date-scroll">
              {monthData.length === 0 ? (
                <p style={{color:'var(--grey)',fontSize:'0.875rem'}}>No availability data. Please seed working hours.</p>
              ) : monthData.map(item => {
                const d   = new Date(item.date+'T00:00')
                const cls = availColor(item)
                const isSelected = selectedDate === item.date
                return (
                  <button key={item.date}
                    className={`date-cell ${cls} ${isSelected?'selected':''}`}
                    onClick={() => cls!=='unavail' && selectDate(item.date)}
                    disabled={cls==='unavail'}
                    title={item.reason || ''}
                  >
                    <span className="dc-day">{format(d,'EEE')}</span>
                    <span className="dc-num">{format(d,'d')}</span>
                    <span className="dc-month">{format(d,'MMM')}</span>
                    {item.isOpen && <span className="dc-slots">{item.availableSlots}</span>}
                    {!item.isOpen && <span className="dc-slots">✕</span>}
                  </button>
                )
              })}
            </div>

            {selectedDate && (
              <div className="slots-section">
                <h2>Time Slots — {format(new Date(selectedDate+'T00:00'),'EEEE, MMMM d')}</h2>
                {slotsLoading ? (
                  <div className="spinner" style={{margin:'20px auto'}}/>
                ) : slotsError ? (
                  <div className="slots-error"><AlertTriangle size={16}/> {slotsError}</div>
                ) : slots.length === 0 ? (
                  <p style={{color:'var(--grey)',fontSize:'0.875rem',padding:'12px 0'}}>No time slots available for this date.</p>
                ) : (
                  <div className="slots-grid">
                    {slots.map((s,i) => (
                      <button key={i}
                        className={`slot-btn ${(!s.available || s.isPast) ? 'taken' : ''} ${selectedSlot===s.time?'selected':''}`}
                        onClick={() => s.available && !s.isPast && setSelectedSlot(s.time)}
                        disabled={!s.available || s.isPast}
                        title={s.isPast ? 'This time has passed' : !s.available ? 'Already booked' : ''}
                      >
                        {s.time}
                        {s.isPast       && <span>Passed</span>}
                        {!s.isPast && !s.available && <span>Booked</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="step-actions">
              <button className="btn btn-primary" disabled={!selectedDate||!selectedSlot} onClick={()=>setStep(1)}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Service */}
        {step === 1 && (
          <div className="step-panel fade-up">
            <h2>Choose a Service</h2>
            {services.length === 0 ? (
              <ErrorMessage message="No services found." onRetry={loadInitial}/>
            ) : (
              <div className="service-select-list">
                {services.map(svc => (
                  <button key={svc._id}
                    className={`svc-select-card ${selectedService?._id===svc._id?'selected':''}`}
                    onClick={()=>setSelectedService(svc)}
                  >
                    <div className="ssc-left">
                      <span className="ssc-emoji">{{ Manicure:'💅', Pedicure:'🦶', 'Nail Art':'🎨', Gel:'✨', Acrylic:'💎', Other:'🌸' }[svc.category]||'💅'}</span>
                      <div>
                        <strong>{svc.name}</strong>
                        <span>{svc.category} · {svc.duration} min</span>
                      </div>
                    </div>
                    <div className="ssc-right">
                      <span className="ssc-price">${svc.price}</span>
                      {selectedService?._id===svc._id && <CheckCircle size={20} className="ssc-check"/>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="step-actions">
              <button className="btn btn-outline" onClick={()=>setStep(0)}>← Back</button>
              <button className="btn btn-primary" disabled={!selectedService} onClick={()=>setStep(2)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Notes */}
        {step === 2 && (
          <div className="step-panel fade-up">
            <h2>Additional Notes</h2>
            <div className="booking-summary">
              <div className="bs-item"><Clock size={14}/> {format(new Date(selectedDate+'T00:00'),'MMM d')} at {selectedSlot}</div>
              <div className="bs-sep">·</div>
              <div className="bs-item">💅 {selectedService?.name}</div>
              <div className="bs-sep">·</div>
              <div className="bs-item">${selectedService?.price}</div>
            </div>
            <div className="form-group">
              <label>Special Requests (optional)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
                placeholder="Any allergies, preferences, or special requests..."/>
            </div>
            <div className="step-actions">
              <button className="btn btn-outline" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn btn-primary" onClick={()=>setStep(3)}>Review →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === 3 && (
          <div className="step-panel fade-up">
            <h2>Review & Confirm</h2>
            <div className="review-card">
              <div className="review-row"><span>Name</span><strong>{user?.name}</strong></div>
              <div className="review-row"><span>Service</span><strong>{selectedService?.name}</strong></div>
              <div className="review-row"><span>Date</span><strong>{format(new Date(selectedDate+'T00:00'),'EEEE, MMMM d, yyyy')}</strong></div>
              <div className="review-row"><span>Time</span><strong>{selectedSlot}</strong></div>
              <div className="review-row"><span>Duration</span><strong>{selectedService?.duration} minutes</strong></div>
              {notes && <div className="review-row"><span>Notes</span><strong>{notes}</strong></div>}
              <div className="review-row total"><span>Total</span><strong>${selectedService?.price}</strong></div>
            </div>
            <div className="policy-note">
              📋 By confirming, you agree to our cancellation policy. Please contact us at least 2 hours before if you need to reschedule.
            </div>
            <div className="step-actions">
              <button className="btn btn-outline" onClick={()=>setStep(2)}>← Back</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? <><Loader size={16} style={{animation:'spin 0.8s linear infinite'}}/> Booking...</>
                  : '✅ Confirm Appointment'
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
