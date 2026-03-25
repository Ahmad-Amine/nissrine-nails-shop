import React, { useEffect, useState, useRef } from 'react'
import {
  CheckCircle, XCircle, RefreshCw, Clock, AlertCircle,
  Phone, Calendar, DollarSign, Printer, Plus, Trash2,
  Settings, Save, X, Edit2, Sparkles, ToggleLeft, ToggleRight,
  CalendarOff, CalendarCheck, Info, Users, KeyRound, Eye, EyeOff, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { appointmentsAPI, availabilityAPI, servicesAPI, adminServicesAPI, authAPI, settingsAPI } from '../services/api'
import { useSettings } from '../context/SettingsContext'
import { format, addDays, startOfToday } from 'date-fns'
import './AdminPage.css'

const DAYS       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const CATEGORIES = ['Manicure','Pedicure','Gel','Acrylic','Nail Art','Other']
const EMOJI      = { Manicure:'💅', Pedicure:'🦶', 'Nail Art':'🎨', Gel:'✨', Acrylic:'💎', Other:'🌸' }
const EMPTY_SVC  = { name:'', description:'', price:'', duration:'', category:'Manicure' }

const STATUS_CONFIG = {
  pending:   { label:'Pending',   color:'#FF9800', bg:'#fff8e1' },
  confirmed: { label:'Confirmed', color:'#4CAF50', bg:'#e8f5e9' },
  rejected:  { label:'Rejected',  color:'#F44336', bg:'#ffebee' },
  cancelled: { label:'Cancelled', color:'#9E9E9E', bg:'#f5f5f5' },
}

// ── Bill Modal ────────────────────────────────────────────────────
function BillModal({ appt, onClose }) {
  const name  = appt.isPhoneBooking ? appt.customerName : appt.user?.name
  const phone = appt.isPhoneBooking ? appt.customerPhone : appt.user?.phone
  const now   = format(new Date(), 'dd/MM/yyyy HH:mm')

  const print = () => {
    const w = window.open('', '_blank', 'width=420,height=640')
    w.document.write(`<html><head><title>Receipt</title>
    <style>body{font-family:'Courier New',monospace;padding:24px;max-width:360px;margin:0 auto;font-size:13px}
    .c{text-align:center}.t{font-size:17px;font-weight:bold}.s{font-size:11px;color:#666;margin:2px 0}
    .d{border-top:1px dashed #999;margin:10px 0}.r{display:flex;justify-content:space-between;margin:5px 0}
    .tot{font-weight:bold;font-size:15px}.paid{color:green;font-weight:bold;text-align:center;margin:6px 0}
    .ft{margin-top:14px;font-size:11px;color:#888;text-align:center}</style></head>
    <body onload="window.print();window.close();">
    <div class="c"><div class="t">💅 Nissrine Nails Shop</div>
    <div class="s">By Nissrine Bou Zeid · Zahle, Lebanon</div></div>
    <div class="d"/><div class="c s">RECEIPT — ${now}</div><div class="d"/>
    <div class="r"><span>Customer:</span><span>${name}</span></div>
    <div class="r"><span>Phone:</span><span>${phone}</span></div>
    <div class="d"/>
    <div class="r"><span>Service:</span><span>${appt.service?.name}</span></div>
    <div class="r"><span>Date:</span><span>${appt.date}</span></div>
    <div class="r"><span>Time:</span><span>${appt.time}</span></div>
    <div class="r"><span>Duration:</span><span>${appt.service?.duration} min</span></div>
    <div class="d"/>
    <div class="r tot"><span>TOTAL:</span><span>$${appt.paidAmount || appt.service?.price}</span></div>
    ${appt.isPaid ? '<div class="paid">✓ PAID IN FULL</div>' : ''}
    <div class="d"/>
    <div class="ft">Thank you for visiting Nissrine Nails Shop! 💅</div>
    </body></html>`)
    w.document.close()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box bill-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-top-bar">
          <h3><Printer size={16}/> Print Receipt</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="bill-paper">
          <div className="bp-center"><div className="bp-title">💅 Nissrine Nails Shop</div>
            <div className="bp-sub">By Nissrine Bou Zeid · Zahle, Lebanon</div></div>
          <div className="bp-divider"/>
          <div className="bp-center bp-sub">RECEIPT — {now}</div>
          <div className="bp-divider"/>
          <div className="bp-row"><span>Customer</span><strong>{name}</strong></div>
          <div className="bp-row"><span>Phone</span><strong>{phone}</strong></div>
          <div className="bp-divider"/>
          <div className="bp-row"><span>Service</span><strong>{appt.service?.name}</strong></div>
          <div className="bp-row"><span>Date</span><strong>{appt.date}</strong></div>
          <div className="bp-row"><span>Time</span><strong>{appt.time}</strong></div>
          <div className="bp-row"><span>Duration</span><strong>{appt.service?.duration} min</strong></div>
          <div className="bp-divider"/>
          <div className="bp-row bp-total"><span>TOTAL</span><strong>${appt.paidAmount || appt.service?.price}</strong></div>
          {appt.isPaid && <div className="bp-paid">✓ PAID IN FULL</div>}
          <div className="bp-divider"/>
          <div className="bp-center bp-footer">Thank you! See you again soon 💅</div>
        </div>
        <div className="modal-actions" style={{marginTop:'16px'}}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
          <button className="btn btn-primary btn-sm" onClick={print}><Printer size={14}/> Print</button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Tab Component ────────────────────────────────────────
function ScheduleTab({ workingHours, setWorkingHours, dateOverrides, setDateOverrides }) {
  const [subTab,      setSubTab]      = useState('weekly')   // 'weekly' | 'dates'
  const [editingDay,  setEditingDay]  = useState(null)
  const [whEdit,      setWhEdit]      = useState({})

  // Date override form
  const [overrideForm, setOverrideForm] = useState({
    date: '', isOpen: true, openTime: '09:00', closeTime: '20:00', slotDuration: 60, reason: ''
  })
  const [overrideSaving, setOverrideSaving] = useState(false)

  // Calendar state for the 30-day visual picker
  const [calDays, setCalDays] = useState([])
  const [calLoading, setCalLoading] = useState(true)

  useEffect(() => {
    // Build a 30-day calendar showing current open/closed status
    const today = startOfToday()
    const days = []
    for (let i = 0; i < 42; i++) {
      const d = addDays(today, i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const override = dateOverrides.find(o => o.date === dateStr)
      const dayOfWeek = d.getDay()
      const wh = workingHours.find(w => w.dayOfWeek === dayOfWeek)
      const weeklyOpen = wh ? wh.isOpen : true

      days.push({
        date: dateStr,
        label: format(d, 'd'),
        dayName: format(d, 'EEE'),
        monthLabel: format(d, 'MMM'),
        showMonth: i === 0 || format(d, 'd') === '1',
        override,
        weeklyOpen,
        effectiveOpen: override ? override.isOpen : weeklyOpen,
        isOverride: !!override,
      })
    }
    setCalDays(days)
    setCalLoading(false)
  }, [workingHours, dateOverrides])

  // Save weekly hours
  const saveWH = async () => {
    try {
      const res = await availabilityAPI.updateWorkingHours(editingDay, whEdit)
      setWorkingHours(p => p.map(w => w.dayOfWeek === editingDay ? res.data.data : w))
      setEditingDay(null)
      toast.success('Weekly schedule updated ✅')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  // Quick toggle a specific date from the calendar
  const quickToggleDate = async (day) => {
    const newOpen = !day.effectiveOpen
    try {
      const payload = {
        date: day.date,
        isOpen: newOpen,
        openTime: day.override?.openTime || '09:00',
        closeTime: day.override?.closeTime || '20:00',
        slotDuration: day.override?.slotDuration || 60,
        reason: newOpen ? 'Opened by admin' : 'Closed by admin'
      }
      const res = await availabilityAPI.setDateOverride(payload)
      const newOverride = res.data.data
      setDateOverrides(p => {
        const exists = p.find(o => o.date === day.date)
        return exists ? p.map(o => o.date === day.date ? newOverride : o) : [...p, newOverride]
      })
      toast.success(`${day.date} is now ${newOpen ? 'OPEN ✅' : 'CLOSED 🚫'}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  // Remove override (go back to weekly default)
  const removeOverride = async (id, date) => {
    try {
      await availabilityAPI.removeDateOverride(id)
      setDateOverrides(p => p.filter(o => o._id !== id))
      toast.success(`${date} reset to weekly default`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  // Save a detailed date override
  const saveOverride = async (e) => {
    e.preventDefault()
    if (!overrideForm.date) { toast.error('Please select a date'); return }
    setOverrideSaving(true)
    try {
      const res = await availabilityAPI.setDateOverride(overrideForm)
      const newOverride = res.data.data
      setDateOverrides(p => {
        const exists = p.find(o => o.date === overrideForm.date)
        return exists ? p.map(o => o.date === overrideForm.date ? newOverride : o) : [...p, newOverride]
      })
      setOverrideForm({ date:'', isOpen:true, openTime:'09:00', closeTime:'20:00', slotDuration:60, reason:'' })
      toast.success(res.data.message)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setOverrideSaving(false) }
  }

  return (
    <div className="form-panel">
      <h2><Clock size={18}/> Schedule Manager</h2>
      <p className="panel-sub">
        Control when the salon is open. Set <strong>weekly defaults</strong> per day of week,
        then use <strong>date overrides</strong> to open or close specific dates.
      </p>

      {/* Sub-tabs */}
      <div className="schedule-subtabs">
        <button className={`sch-tab ${subTab==='weekly'?'active':''}`} onClick={()=>setSubTab('weekly')}>
          📅 Weekly Defaults
        </button>
        <button className={`sch-tab ${subTab==='calendar'?'active':''}`} onClick={()=>setSubTab('calendar')}>
          🗓️ Date Calendar
        </button>
        <button className={`sch-tab ${subTab==='dates'?'active':''}`} onClick={()=>setSubTab('dates')}>
          ✏️ Date Overrides
          {dateOverrides.length > 0 && <span className="sch-tab-badge">{dateOverrides.length}</span>}
        </button>
      </div>

      {/* ── WEEKLY SUB-TAB ── */}
      {subTab === 'weekly' && (
        <div className="wh-list">
          <div className="schedule-info-box">
            <Info size={15}/>
            <p>These are the <strong>default</strong> hours for each day of the week. You can override any specific date in the "Date Calendar" or "Date Overrides" tab.</p>
          </div>
          {workingHours.length === 0
            ? <p className="empty-hint">No schedule found.</p>
            : workingHours.map(wh => (
              <div key={wh.dayOfWeek} className="wh-row">
                {editingDay === wh.dayOfWeek ? (
                  <div className="wh-edit-box">
                    <strong className="wh-day-name">{DAYS[wh.dayOfWeek]}</strong>
                    <label className="wh-toggle-label">
                      <input type="checkbox" checked={whEdit.isOpen||false} onChange={e=>setWhEdit(p=>({...p,isOpen:e.target.checked}))}/>
                      <span>{whEdit.isOpen ? '✅ Open' : '🚫 Closed'}</span>
                    </label>
                    {whEdit.isOpen && (
                      <div className="wh-time-row">
                        <span>From</span>
                        <input type="time" value={whEdit.openTime||'09:00'} onChange={e=>setWhEdit(p=>({...p,openTime:e.target.value}))}/>
                        <span>To</span>
                        <input type="time" value={whEdit.closeTime||'20:00'} onChange={e=>setWhEdit(p=>({...p,closeTime:e.target.value}))}/>
                        <span>Slot</span>
                        <select value={whEdit.slotDuration||60} onChange={e=>setWhEdit(p=>({...p,slotDuration:Number(e.target.value)}))}>
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                          <option value={90}>90 min</option>
                        </select>
                      </div>
                    )}
                    <div className="wh-edit-btns">
                      <button className="btn btn-primary btn-sm" onClick={saveWH}><Save size={13}/> Save</button>
                      <button className="btn btn-outline btn-sm" onClick={()=>setEditingDay(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="wh-row-inner">
                    <div className="wh-status-dot" style={{background: wh.isOpen ? 'var(--success)' : 'var(--error)'}}/>
                    <div className="wh-info">
                      <strong>{DAYS[wh.dayOfWeek]}</strong>
                      {wh.isOpen
                        ? <span className="wh-open">{wh.openTime} – {wh.closeTime} · {wh.slotDuration} min slots</span>
                        : <span className="wh-closed">Closed</span>
                      }
                    </div>
                    <button className="btn-edit-day" onClick={()=>{setEditingDay(wh.dayOfWeek);setWhEdit({...wh})}}>
                      <Settings size={13}/> Edit
                    </button>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* ── CALENDAR SUB-TAB ── */}
      {subTab === 'calendar' && (
        <div className="cal-section">
          <div className="schedule-info-box">
            <Info size={15}/>
            <p>Click any date to <strong>toggle it open or closed</strong>. Dates with a custom override are marked with a dot. Overridden dates take priority over the weekly schedule.</p>
          </div>

          <div className="cal-legend">
            <span className="cal-leg open"/>Open (weekly)
            <span className="cal-leg closed"/>Closed (weekly)
            <span className="cal-leg override-open"/>Overridden Open
            <span className="cal-leg override-closed"/>Overridden Closed
          </div>

          {calLoading ? <div className="spinner" style={{margin:'20px auto'}}/> : (
            <div className="cal-grid">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="cal-day-label">{d}</div>
              ))}
              {calDays.map((day, i) => {
                const cls = day.isOverride
                  ? (day.effectiveOpen ? 'override-open' : 'override-closed')
                  : (day.effectiveOpen ? 'open' : 'closed')
                return (
                  <button key={day.date} className={`cal-cell ${cls}`}
                    onClick={() => quickToggleDate(day)}
                    title={`${day.date}\n${day.effectiveOpen ? 'Open' : 'Closed'}${day.isOverride ? ' (override)' : ' (weekly default)'}\nClick to toggle`}
                  >
                    {day.showMonth && <span className="cal-month">{day.monthLabel}</span>}
                    <span className="cal-num">{day.label}</span>
                    {day.isOverride && <span className="cal-override-dot"/>}
                  </button>
                )
              })}
            </div>
          )}

          <p className="cal-hint">
            💡 Clicking a date creates a <strong>one-time override</strong> for that specific date only.
            To remove the override and go back to the weekly default, go to the <strong>Date Overrides</strong> tab.
          </p>
        </div>
      )}

      {/* ── DATE OVERRIDES SUB-TAB ── */}
      {subTab === 'dates' && (
        <div className="overrides-section">
          <div className="schedule-info-box">
            <Info size={15}/>
            <p>Add a specific date override to open or close a date differently from its weekly default. You can also set custom hours for that date.</p>
          </div>

          {/* Add form */}
          <form onSubmit={saveOverride} className="override-form">
            <h4>Add / Edit Date Override</h4>
            <div className="form-row-2">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={overrideForm.date}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={e=>setOverrideForm(p=>({...p,date:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <div className="toggle-row">
                  <button type="button"
                    className={`toggle-btn ${overrideForm.isOpen ? 'active-open' : ''}`}
                    onClick={()=>setOverrideForm(p=>({...p,isOpen:true}))}>
                    <CalendarCheck size={14}/> Open
                  </button>
                  <button type="button"
                    className={`toggle-btn ${!overrideForm.isOpen ? 'active-closed' : ''}`}
                    onClick={()=>setOverrideForm(p=>({...p,isOpen:false}))}>
                    <CalendarOff size={14}/> Closed
                  </button>
                </div>
              </div>
            </div>

            {overrideForm.isOpen && (
              <div className="form-row-3">
                <div className="form-group">
                  <label>Open Time</label>
                  <input type="time" value={overrideForm.openTime} onChange={e=>setOverrideForm(p=>({...p,openTime:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label>Close Time</label>
                  <input type="time" value={overrideForm.closeTime} onChange={e=>setOverrideForm(p=>({...p,closeTime:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label>Slot Duration</label>
                  <select value={overrideForm.slotDuration} onChange={e=>setOverrideForm(p=>({...p,slotDuration:Number(e.target.value)}))}>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Reason (optional)</label>
              <input value={overrideForm.reason} onChange={e=>setOverrideForm(p=>({...p,reason:e.target.value}))}
                placeholder={overrideForm.isOpen ? 'e.g. Special opening, Extra day' : 'e.g. Public holiday, Vacation, Personal day'}/>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={overrideSaving}>
              {overrideSaving ? <div className="spinner spinner-sm"/> : <><Save size={14}/> Save Override</>}
            </button>
          </form>

          {/* List */}
          <div className="overrides-list">
            <h4 style={{marginBottom:'12px'}}>Current Date Overrides ({dateOverrides.length})</h4>
            {dateOverrides.length === 0 ? (
              <p className="empty-hint">No date overrides. All days follow the weekly schedule.</p>
            ) : dateOverrides.map(ov => (
              <div key={ov._id} className={`override-row ${ov.isOpen ? 'ov-open' : 'ov-closed'}`}>
                <div className={`ov-status-badge ${ov.isOpen ? 'badge-open' : 'badge-closed'}`}>
                  {ov.isOpen ? <CalendarCheck size={13}/> : <CalendarOff size={13}/>}
                  {ov.isOpen ? 'Open' : 'Closed'}
                </div>
                <div className="ov-info">
                  <strong>{format(new Date(ov.date+'T00:00'), 'EEE, MMMM d, yyyy')}</strong>
                  {ov.isOpen
                    ? <span>{ov.openTime} – {ov.closeTime} · {ov.slotDuration} min slots</span>
                    : <span>{ov.reason || 'Closed for this date'}</span>
                  }
                </div>
                <button className="btn-remove-date" onClick={()=>removeOverride(ov._id, ov.date)}>
                  <Trash2 size={13}/> Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reset Password Input helper ───────────────────────────────────
function ResetPasswordInput({ value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div className="pw-wrap" style={{marginBottom:'12px'}}>
      <input
        type={show ? 'text' : 'password'}
        placeholder="Enter new password (min. 6 chars)"
        value={value}
        onChange={onChange}
        style={{
          width:'100%', padding:'12px 44px 12px 14px',
          borderRadius:'12px', border:'2px solid var(--secondary)',
          fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'var(--dark)',
          outline:'none'
        }}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow(s => !s)}
        style={{position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', color:'var(--grey)', display:'flex', alignItems:'center'}}
      >
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  )
}

// ── Main AdminPage ────────────────────────────────────────────────
export default function AdminPage() {
  const { settings: globalSettings, reload: reloadSettings } = useSettings()
  const [tab,             setTab]             = useState('appointments')
  const [appointments,    setAppointments]    = useState([])
  const [revenue,         setRevenue]         = useState(null)
  const [workingHours,    setWorkingHours]    = useState([])
  const [dateOverrides,   setDateOverrides]   = useState([])
  const [services,        setServices]        = useState([])
  const [users,           setUsers]           = useState([])
  const [usersLoading,    setUsersLoading]    = useState(false)
  const [resetModal,      setResetModal]      = useState(null)
  const [newPassword,     setNewPassword]     = useState("")
  const [resetLoading,    setResetLoading]    = useState(false)
  const [loading,         setLoading]         = useState(true)
  const [userSearch,      setUserSearch]      = useState('')

  // Settings form state
  const [settingsForm,    setSettingsForm]    = useState(null)  // null until loaded
  const [settingsSaving,  setSettingsSaving]  = useState(false)






  const [filter,          setFilter]          = useState('pending')
  const [actioning,       setActioning]       = useState(null)
  const [noteModal,       setNoteModal]       = useState(null)
  const [noteText,        setNoteText]        = useState('')
  const [printAppt,       setPrintAppt]       = useState(null)
  const [phoneForm,       setPhoneForm]       = useState({ customerName:'', customerPhone:'', serviceId:'', date:'', time:'', notes:'' })
  const [phoneSlots,      setPhoneSlots]      = useState([])
  const [phoneLoading,    setPhoneLoading]    = useState(false)
  const [phoneSubmitting, setPhoneSubmitting] = useState(false)
  const [serviceForm,     setServiceForm]     = useState(EMPTY_SVC)
  const [editingService,  setEditingService]  = useState(null)
  const [serviceModal,    setServiceModal]    = useState(false)
  const [serviceLoading,  setServiceLoading]  = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [apptRes, revRes, whRes, ovRes, svcRes] = await Promise.all([
        appointmentsAPI.getAll(),
        appointmentsAPI.getRevenue(),
        availabilityAPI.getWorkingHours(),
        availabilityAPI.getDateOverrides(),
        servicesAPI.getAll(),
      ])
      setAppointments(apptRes.data.data)
      setRevenue(revRes.data.data)
      setWorkingHours(whRes.data.data)
      setDateOverrides(ovRes.data.data)
      setServices(svcRes.data.data)
    } catch (err) {
      toast.error('Failed to load: ' + (err.response?.data?.message || err.message))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  // Load users lazily when Users tab is opened
  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await authAPI.getAllUsers()
      setUsers(res.data.data)
    } catch (err) {
      toast.error('Failed to load users: ' + (err.response?.data?.message || err.message))
    } finally { setUsersLoading(false) }
  }

  useEffect(() => {
    if (tab === 'users' && users.length === 0) loadUsers()
  }, [tab])

  useEffect(() => {
    if (tab === 'settings' && !settingsForm) {
      setSettingsForm({ ...globalSettings })
    }
  }, [tab, globalSettings])

  useEffect(() => {
    if (!phoneForm.date) return
    setPhoneLoading(true)
    availabilityAPI.getSlots(phoneForm.date)
      .then(r => setPhoneSlots(r.data.slots || []))
      .catch(() => setPhoneSlots([]))
      .finally(() => setPhoneLoading(false))
  }, [phoneForm.date])

  // Actions
  const openNote = (id, action) => { setNoteModal({ id, action }); setNoteText('') }
  const execAction = async () => {
    if (!noteModal) return
    const { id, action } = noteModal
    setActioning(id); setNoteModal(null)
    try {
      if (action === 'confirm') {
        await appointmentsAPI.confirm(id, noteText)
        setAppointments(p => p.map(a => a._id===id ? {...a,status:'confirmed',adminNote:noteText} : a))
        toast.success('✅ Confirmed!')
      } else {
        await appointmentsAPI.reject(id, noteText)
        setAppointments(p => p.map(a => a._id===id ? {...a,status:'rejected',adminNote:noteText} : a))
        toast.success('Rejected.')
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setActioning(null) }
  }

  const markPaid = async (appt) => {
    const amt = window.prompt(`Enter amount paid (default $${appt.service?.price}):`, appt.paidAmount || appt.service?.price)
    if (amt === null) return
    if (isNaN(Number(amt))) { toast.error('Invalid amount'); return }
    try {
      await appointmentsAPI.markPaid(appt._id, { paidAmount: Number(amt) })
      setAppointments(p => p.map(a => a._id===appt._id ? {...a,isPaid:true,paidAmount:Number(amt)} : a))
      toast.success('💰 Marked as paid!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const submitPhone = async (e) => {
    e.preventDefault()
    const { customerName, customerPhone, serviceId, date, time } = phoneForm
    if (!customerName || !customerPhone || !serviceId || !date || !time)
      { toast.error('All fields marked * are required'); return }
    setPhoneSubmitting(true)
    try {
      await appointmentsAPI.phoneBooking(phoneForm)
      setPhoneForm({ customerName:'', customerPhone:'', serviceId:'', date:'', time:'', notes:'' })
      setPhoneSlots([])
      toast.success('📞 Phone booking confirmed!')
      setTab('appointments'); setFilter('confirmed'); loadAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed') }
    finally { setPhoneSubmitting(false) }
  }

  const openAddService = () => { setEditingService(null); setServiceForm(EMPTY_SVC); setServiceModal(true) }
  const openEditService = (s) => { setEditingService(s); setServiceForm({ name:s.name, description:s.description, price:s.price, duration:s.duration, category:s.category }); setServiceModal(true) }

  const submitService = async (e) => {
    e.preventDefault()
    const { name, description, price, duration, category } = serviceForm
    if (!name || !description || !price || !duration) { toast.error('All fields required'); return }
    if (isNaN(+price)||+price<=0) { toast.error('Price must be a positive number'); return }
    if (isNaN(+duration)||+duration<=0) { toast.error('Duration must be a positive number'); return }
    setServiceLoading(true)
    try {
      const payload = { name, description, price:+price, duration:+duration, category }
      if (editingService) {
        const r = await adminServicesAPI.update(editingService._id, payload)
        setServices(p => p.map(s => s._id===editingService._id ? r.data.data : s))
        toast.success('Service updated ✅')
      } else {
        const r = await adminServicesAPI.create(payload)
        setServices(p => [...p, r.data.data])
        toast.success('Service created ✅')
      }
      setServiceModal(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setServiceLoading(false) }
  }

  const removeService = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return
    try {
      await adminServicesAPI.remove(id)
      setServices(p => p.filter(s => s._id !== id))
      toast.success('Service removed ✅')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  // ── Reset user password ────────────────────────────────
  const openResetModal = (user) => {
    setResetModal({ userId: user._id, userName: user.name })
    setNewPassword('')
  }

  const submitReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters'); return
    }
    setResetLoading(true)
    try {
      await authAPI.resetUserPassword(resetModal.userId, { newPassword })
      toast.success(`✅ Password reset for ${resetModal.userName}`)
      setResetModal(null)
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally { setResetLoading(false) }
  }

  // ── Save shop settings ────────────────────────────────
  const submitSettings = async (e) => {
    e.preventDefault()
    setSettingsSaving(true)
    try {
      await settingsAPI.update(settingsForm)
      reloadSettings()
      toast.success('Settings saved! Footer updated ✅')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings')
    } finally { setSettingsSaving(false) }
  }

  const filtered = filter==='all' ? appointments : appointments.filter(a => a.status===filter)
  const counts = {
    all:       appointments.length,
    pending:   appointments.filter(a=>a.status==='pending').length,
    confirmed: appointments.filter(a=>a.status==='confirmed').length,
    rejected:  appointments.filter(a=>a.status==='rejected').length,
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-orb"/>
        <div className="admin-header-left">
          <h1>Admin Dashboard 💅</h1>
          <p>Nissrine Nails Shop — Zahle, Lebanon</p>
        </div>
        <button className="admin-refresh-btn" onClick={loadAll} disabled={loading}>
          <RefreshCw size={15} style={{animation:loading?'spin 1s linear infinite':'none'}}/> <span>Refresh</span>
        </button>
      </div>

      {/* Revenue */}
      {revenue && (
        <div className="revenue-strip">
          <div className="rev-card"><DollarSign size={18}/><div><strong>${revenue.totalRevenue}</strong><span>Total Revenue</span></div></div>
          <div className="rev-card green"><CheckCircle size={18}/><div><strong>{revenue.paidCount}</strong><span>Paid</span></div></div>
          <div className="rev-card orange"><AlertCircle size={18}/><div><strong>{revenue.unpaidCount}</strong><span>Unpaid</span></div></div>
          <div className="rev-card blue"><Calendar size={18}/><div><strong>{revenue.todayAppts}</strong><span>Today</span></div></div>
          <div className="rev-card pink"><DollarSign size={18}/><div><strong>${revenue.todayRevenue}</strong><span>Today Revenue</span></div></div>
        </div>
      )}

      {/* Tab nav */}
      <div className="admin-tabs-nav">
        {[
          { key:'appointments', label:'📋 Appointments' },
          { key:'phone',        label:'📞 Phone Booking' },
          { key:'services',     label:'💅 Services' },
          { key:'schedule',     label:'🗓️ Schedule' },
          { key:'users',        label:'👥 Users' },
          { key:'settings',     label:'⚙️ Settings' },
        ].map(t => (
          <button key={t.key} className={`admin-tab-nav-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
            {t.label}
            {t.key==='appointments' && counts.pending>0 && <span className="nav-pending-badge">{counts.pending}</span>}
          </button>
        ))}
      </div>

      <div className="admin-body">
        {loading ? (
          <div className="admin-loading"><div className="spinner"/><p>Loading dashboard...</p></div>
        ) : (
          <>
            {/* ══ APPOINTMENTS ══ */}
            {tab === 'appointments' && (
              <>
                <div className="admin-filter-tabs">
                  {['pending','all','confirmed','rejected','cancelled'].map(f => (
                    <button key={f} className={`filter-tab ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                      {counts[f]>0 && <span className="ftab-count">{counts[f]}</span>}
                    </button>
                  ))}
                </div>
                {filtered.length===0
                  ? <div className="admin-empty"><AlertCircle size={36}/><p>No {filter!=='all'?filter:''} appointments.</p></div>
                  : (
                    <div className="admin-list">
                      {filtered.map((appt,i) => {
                        const st    = STATUS_CONFIG[appt.status]||STATUS_CONFIG.pending
                        const name  = appt.isPhoneBooking ? appt.customerName : appt.user?.name
                        const phone = appt.isPhoneBooking ? appt.customerPhone : appt.user?.phone
                        const email = appt.isPhoneBooking ? '(phone booking)' : appt.user?.email
                        return (
                          <div key={appt._id} className={`admin-card fade-up ${appt.status==='pending'?'is-pending':''}`} style={{animationDelay:`${i*0.04}s`}}>
                            <div className="ac-status-bar" style={{background:st.color}}/>
                            <div className="ac-body">
                              <div className="ac-top">
                                <div className="ac-customer">
                                  <div className="ac-avatar">{name?.charAt(0)||'?'}</div>
                                  <div>
                                    <strong>{name} {appt.isPhoneBooking&&<span className="phone-tag">📞</span>}</strong>
                                    <span>{email}</span><span>📞 {phone}</span>
                                  </div>
                                </div>
                                <div className="ac-top-right">
                                  <span className="badge" style={{background:st.bg,color:st.color}}>{st.label}</span>
                                  {appt.isPaid ? <span className="paid-badge">💰 ${appt.paidAmount}</span>
                                    : appt.status==='confirmed' && <span className="unpaid-badge">Unpaid</span>}
                                </div>
                              </div>
                              <div className="ac-details">
                                <div className="ac-chip">💅 {appt.service?.name}</div>
                                <div className="ac-chip"><Calendar size={12}/> {appt.date}</div>
                                <div className="ac-chip"><Clock size={12}/> {appt.time}</div>
                                <div className="ac-chip">💰 ${appt.paidAmount||appt.service?.price}</div>
                                <div className="ac-chip">⏱ {appt.service?.duration} min</div>
                              </div>
                              {appt.notes&&<div className="ac-note-customer">📝 {appt.notes}</div>}
                              {appt.adminNote&&<div className="ac-note-admin">Note: {appt.adminNote}</div>}
                              <div className="ac-actions">
                                {appt.status==='pending'&&<>
                                  <button className="ac-btn-confirm" disabled={actioning===appt._id} onClick={()=>openNote(appt._id,'confirm')}><CheckCircle size={13}/> Confirm</button>
                                  <button className="ac-btn-reject"  disabled={actioning===appt._id} onClick={()=>openNote(appt._id,'reject')} ><XCircle size={13}/> Reject</button>
                                </>}
                                {appt.status==='confirmed'&&!appt.isPaid&&<button className="ac-btn-pay" onClick={()=>markPaid(appt)}><DollarSign size={13}/> Mark Paid</button>}
                                {appt.status==='confirmed'&&<button className="ac-btn-print" onClick={()=>setPrintAppt(appt)}><Printer size={13}/> Print Bill</button>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                }
              </>
            )}

            {/* ══ PHONE BOOKING ══ */}
            {tab === 'phone' && (
              <div className="form-panel">
                <h2>📞 Phone Booking</h2>
                <p className="panel-sub">Create and instantly confirm an appointment for a customer who called.</p>
                <form onSubmit={submitPhone}>
                  <div className="form-row-2">
                    <div className="form-group"><label>Customer Name *</label><input value={phoneForm.customerName} onChange={e=>setPhoneForm(p=>({...p,customerName:e.target.value}))} placeholder="Full name"/></div>
                    <div className="form-group"><label>Phone *</label><input value={phoneForm.customerPhone} onChange={e=>setPhoneForm(p=>({...p,customerPhone:e.target.value}))} placeholder="+961 71 234 567"/></div>
                  </div>
                  <div className="form-group">
                    <label>Service *</label>
                    <select value={phoneForm.serviceId} onChange={e=>setPhoneForm(p=>({...p,serviceId:e.target.value}))}>
                      <option value="">-- Select service --</option>
                      {services.map(s=><option key={s._id} value={s._id}>{EMOJI[s.category]} {s.name} — ${s.price} ({s.duration} min)</option>)}
                    </select>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Date *</label><input type="date" value={phoneForm.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setPhoneForm(p=>({...p,date:e.target.value,time:''}))} /></div>
                    <div className="form-group">
                      <label>Time Slot *</label>
                      {!phoneForm.date ? <p className="form-hint">Pick a date first.</p>
                        : phoneLoading ? <div className="spinner spinner-sm" style={{margin:'8px 0'}}/>
                        : phoneSlots.length===0 ? <p className="form-hint" style={{color:'var(--error)'}}>No slots available.</p>
                        : <div className="slot-grid-sm">{phoneSlots.map(s=>(
                            <button key={s.time} type="button"
                              className={`slot-sm ${!s.available?'taken':''} ${phoneForm.time===s.time?'selected':''}`}
                              onClick={()=>s.available&&setPhoneForm(p=>({...p,time:s.time}))}
                              disabled={!s.available}>{s.time}</button>
                          ))}</div>
                      }
                    </div>
                  </div>
                  <div className="form-group"><label>Notes (optional)</label><textarea value={phoneForm.notes} onChange={e=>setPhoneForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Special requests..."/></div>
                  <button type="submit" className="btn btn-primary" disabled={phoneSubmitting}>
                    {phoneSubmitting ? <div className="spinner spinner-sm"/> : <><Phone size={15}/> Create & Confirm</>}
                  </button>
                </form>
              </div>
            )}

            {/* ══ SERVICES ══ */}
            {tab === 'services' && (
              <div className="form-panel">
                <div className="panel-header-row">
                  <div><h2><Sparkles size={18}/> Services</h2><p className="panel-sub">Add, edit or remove services and prices.</p></div>
                  <button className="btn btn-primary btn-sm" onClick={openAddService}><Plus size={14}/> Add Service</button>
                </div>
                {services.length===0
                  ? <div className="admin-empty" style={{padding:'40px 0'}}><Sparkles size={32}/><p>No services yet.</p></div>
                  : <div className="services-mgmt-list">
                      {services.map(svc=>(
                        <div key={svc._id} className="svc-mgmt-row">
                          <div className="svc-mgmt-icon">{EMOJI[svc.category]||'💅'}</div>
                          <div className="svc-mgmt-info">
                            <strong>{svc.name}</strong>
                            <span>{svc.category} · {svc.duration} min · <b style={{color:'var(--primary)'}}>${svc.price}</b></span>
                            <p>{svc.description}</p>
                          </div>
                          <div className="svc-mgmt-actions">
                            <button className="svc-edit-btn" onClick={()=>openEditService(svc)}><Edit2 size={13}/> Edit</button>
                            <button className="svc-del-btn"  onClick={()=>removeService(svc._id,svc.name)}><Trash2 size={13}/> Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* ══ SCHEDULE ══ */}
            {tab === 'schedule' && (
              <ScheduleTab
                workingHours={workingHours}
                setWorkingHours={setWorkingHours}
                dateOverrides={dateOverrides}
                setDateOverrides={setDateOverrides}
              />
            )}

            {/* ══ USERS ══ */}
            {tab === 'users' && (
              <div className="form-panel">
                <div className="panel-header-row">
                  <div>
                    <h2><Users size={18}/> User Management</h2>
                    <p className="panel-sub">View all registered customers and reset their passwords if needed.</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={loadUsers} disabled={usersLoading}>
                    <RefreshCw size={14} style={{animation: usersLoading ? 'spin 1s linear infinite' : 'none'}}/> Refresh
                  </button>
                </div>

                {/* Search bar */}
                {users.length > 0 && (
                  <div className="user-search-wrap">
                    <Search size={15}/>
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                    {userSearch && (
                      <button className="user-search-clear" onClick={() => setUserSearch('')}>
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                )}

                {usersLoading ? (
                  <div className="admin-loading"><div className="spinner"/><p>Loading users...</p></div>
                ) : users.length === 0 ? (
                  <div className="admin-empty">
                    <Users size={36}/>
                    <p>No users registered yet.</p>
                  </div>
                ) : (() => {
                  const q = userSearch.toLowerCase().trim()
                  const filtered = q
                    ? users.filter(u =>
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        u.phone.toLowerCase().includes(q)
                      )
                    : users

                  return (
                    <>
                      {q && (
                        <p style={{fontSize:'0.8rem',color:'var(--grey)',marginBottom:'10px'}}>
                          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{userSearch}"
                        </p>
                      )}
                      {filtered.length === 0 ? (
                        <div className="admin-empty" style={{padding:'30px 0'}}>
                          <p>No users match "{userSearch}"</p>
                        </div>
                      ) : (
                        <div className="users-list">
                          {filtered.map((u, i) => (
                            <div key={u._id} className={`user-row fade-up ${u.role === 'admin' ? 'user-admin' : ''}`} style={{animationDelay:`${i*0.04}s`}}>
                              <div className="user-avatar">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="user-info">
                                <strong>
                                  {u.name}
                                  {u.role === 'admin' && <span className="user-admin-badge">Admin</span>}
                                </strong>
                                <span>📧 {u.email}</span>
                                <span>📞 {u.phone}</span>
                                <span className="user-joined">Joined {format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                              {u.role !== 'admin' && (
                                <button className="user-reset-btn" onClick={() => openResetModal(u)}>
                                  <KeyRound size={13}/> Reset Password
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Note modal */}
      {noteModal && (
        <div className="modal-overlay" onClick={()=>setNoteModal(null)}>
          <div className="modal-box fade-up" onClick={e=>e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>{noteModal.action==='confirm'?'✅ Confirm':'❌ Reject'} Appointment</h3>
              <button className="modal-close-btn" onClick={()=>setNoteModal(null)}><X size={18}/></button>
            </div>
            <p>Optional note for the customer.</p>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3}
              placeholder={noteModal.action==='confirm'?'e.g. "See you soon! Arrive 5 min early."':'e.g. "Please book another available time."'}/>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={()=>setNoteModal(null)}>Cancel</button>
              <button className={`btn btn-sm ${noteModal.action==='confirm'?'btn-confirm-final':'btn-reject-final'}`} onClick={execAction}>
                {noteModal.action==='confirm'?<><CheckCircle size={13}/> Confirm</>:<><XCircle size={13}/> Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service modal */}
      {serviceModal && (
        <div className="modal-overlay" onClick={()=>setServiceModal(false)}>
          <div className="modal-box service-modal fade-up" onClick={e=>e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3>{editingService?<><Edit2 size={15}/> Edit Service</>:<><Plus size={15}/> Add Service</>}</h3>
              <button className="modal-close-btn" onClick={()=>setServiceModal(false)}><X size={18}/></button>
            </div>
            <form onSubmit={submitService}>
              <div className="form-group"><label>Name *</label><input value={serviceForm.name} onChange={e=>setServiceForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Gel Manicure"/></div>
              <div className="form-group"><label>Description *</label><textarea value={serviceForm.description} onChange={e=>setServiceForm(p=>({...p,description:e.target.value}))} rows={2} placeholder="Describe the service..."/></div>
              <div className="form-row-2">
                <div className="form-group"><label>Price ($) *</label><input type="number" min="1" value={serviceForm.price} onChange={e=>setServiceForm(p=>({...p,price:e.target.value}))} placeholder="40"/></div>
                <div className="form-group"><label>Duration (min) *</label><input type="number" min="1" value={serviceForm.duration} onChange={e=>setServiceForm(p=>({...p,duration:e.target.value}))} placeholder="60"/></div>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select value={serviceForm.category} onChange={e=>setServiceForm(p=>({...p,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{EMOJI[c]} {c}</option>)}
                </select>
              </div>
              <div className="modal-actions" style={{marginTop:'10px'}}>
                <button type="button" className="btn btn-outline btn-sm" onClick={()=>setServiceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={serviceLoading}>
                  {serviceLoading?<div className="spinner spinner-sm"/>:editingService?<><Save size={13}/> Save</>:<><Plus size={13}/> Add</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div style={{maxWidth:'720px',margin:'0 auto',padding:'0'}}>
          {/* Cleanup card */}
          <div className="card" style={{marginBottom:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
            <div>
              <h4 style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',color:'var(--dark)',marginBottom:'4px'}}>
                🧹 Appointment Cleanup
              </h4>
              <p style={{fontSize:'0.82rem',color:'var(--grey)'}}>
                Automatically removes appointments older than 2 weeks. Also runs every day at midnight.
              </p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={async () => {
              try {
                const res = await import('../services/api').then(m => m.appointmentsAPI.getAll())
                toast('Cleanup runs automatically at midnight ✅', { icon: '🧹' })
              } catch {}
            }}>
              🧹 Run Cleanup Now
            </button>
          </div>

          {/* Settings form */}
          {!settingsForm ? (
            <div className="admin-loading"><div className="spinner"/><p>Loading settings...</p></div>
          ) : (
            <form onSubmit={submitSettings}>
              {/* Shop Info */}
              <div className="card" style={{marginBottom:'16px'}}>
                <h4 className="settings-section-title">🏪 Shop Info</h4>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Shop Name</label>
                    <input value={settingsForm.shopName||''} onChange={e=>setSettingsForm(p=>({...p,shopName:e.target.value}))} placeholder="Nissrine Nails Shop"/>
                  </div>
                  <div className="form-group">
                    <label>Tagline</label>
                    <input value={settingsForm.tagline||''} onChange={e=>setSettingsForm(p=>({...p,tagline:e.target.value}))} placeholder="By Nissrine Bou Zeid"/>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Address</label>
                    <input value={settingsForm.address||''} onChange={e=>setSettingsForm(p=>({...p,address:e.target.value}))} placeholder="Zahle, Lebanon"/>
                  </div>
                  <div className="form-group">
                    <label>Google Maps URL</label>
                    <input value={settingsForm.googleMapsUrl||''} onChange={e=>setSettingsForm(p=>({...p,googleMapsUrl:e.target.value}))} placeholder="https://maps.google.com/..."/>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={settingsForm.email||''} onChange={e=>setSettingsForm(p=>({...p,email:e.target.value}))} placeholder="hello@nissrinenails.com"/>
                </div>
              </div>

              {/* Working Hours Display */}
              <div className="card" style={{marginBottom:'16px'}}>
                <h4 className="settings-section-title">🕐 Footer Hours Text</h4>
                <p className="panel-sub" style={{marginBottom:'14px'}}>This is the text shown in the footer — update it to match your actual schedule.</p>
                <div className="form-group">
                  <label>Weekdays</label>
                  <input value={settingsForm.hoursWeekdays||''} onChange={e=>setSettingsForm(p=>({...p,hoursWeekdays:e.target.value}))} placeholder="Mon–Fri: 9 AM – 8 PM"/>
                </div>
                <div className="form-group">
                  <label>Saturday</label>
                  <input value={settingsForm.hoursSaturday||''} onChange={e=>setSettingsForm(p=>({...p,hoursSaturday:e.target.value}))} placeholder="Saturday: 10 AM – 6 PM"/>
                </div>
                <div className="form-group">
                  <label>Sunday <span style={{fontWeight:'400',color:'var(--grey)'}}>(leave empty if closed)</span></label>
                  <input value={settingsForm.hoursSunday||''} onChange={e=>setSettingsForm(p=>({...p,hoursSunday:e.target.value}))} placeholder="Sunday: Closed"/>
                </div>
              </div>

              {/* Social & Contact */}
              <div className="card" style={{marginBottom:'20px'}}>
                <h4 className="settings-section-title">📱 Contact & Social Media</h4>
                <p className="panel-sub" style={{marginBottom:'14px'}}>These appear as clickable icons in the footer. Leave empty to hide.</p>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>📞 Phone Number</label>
                    <input value={settingsForm.phone||''} onChange={e=>setSettingsForm(p=>({...p,phone:e.target.value}))} placeholder="+961 71 234 567"/>
                  </div>
                  <div className="form-group">
                    <label>💬 WhatsApp Number</label>
                    <input value={settingsForm.whatsapp||''} onChange={e=>setSettingsForm(p=>({...p,whatsapp:e.target.value}))} placeholder="+961 71 234 567"/>
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>📘 Facebook</label>
                    <input value={settingsForm.facebook||''} onChange={e=>setSettingsForm(p=>({...p,facebook:e.target.value}))} placeholder="facebook.com/yourpage or just username"/>
                  </div>
                  <div className="form-group">
                    <label>📸 Instagram</label>
                    <input value={settingsForm.instagram||''} onChange={e=>setSettingsForm(p=>({...p,instagram:e.target.value}))} placeholder="@yourhandle or full URL"/>
                  </div>
                </div>
                <div className="form-group" style={{maxWidth:'50%'}}>
                  <label>🎵 TikTok</label>
                  <input value={settingsForm.tiktok||''} onChange={e=>setSettingsForm(p=>({...p,tiktok:e.target.value}))} placeholder="@yourhandle or full URL"/>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={settingsSaving}>
                {settingsSaving ? <><div className="spinner spinner-sm"/> Saving...</> : '💾 Save All Settings'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Bill modal */}
      {/* ── Reset Password Modal ── */}
      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(null)}>
          <div className="modal-box fade-up" onClick={e => e.stopPropagation()}>
            <div className="modal-top-bar">
              <h3><KeyRound size={16}/> Reset Password</h3>
              <button className="modal-close-btn" onClick={() => setResetModal(null)}><X size={18}/></button>
            </div>
            <p>Set a new password for <strong>{resetModal.userName}</strong>. They will need to use this password to log in next time.</p>
            <div className="reset-pw-field">
              <ResetPasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p style={{fontSize:'0.78rem', color:'var(--error)', marginBottom:'10px'}}>
                Password must be at least 6 characters
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setResetModal(null)}>Cancel</button>
              <button
                className="btn-confirm-final"
                onClick={submitReset}
                disabled={resetLoading || newPassword.length < 6}
                style={{opacity: newPassword.length < 6 ? 0.5 : 1}}
              >
                {resetLoading
                  ? <div className="spinner spinner-sm"/>
                  : <><KeyRound size={14}/> Reset Password</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {printAppt && <BillModal appt={printAppt} onClose={()=>setPrintAppt(null)}/>}
    </div>
  )
}
