import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Clock, Filter } from 'lucide-react'
import { servicesAPI } from '../services/api'
import { LoadingPage, ErrorMessage } from '../components/LoadingSpinner'
import './ServicesPage.css'

const CATEGORIES = ['All','Manicure','Pedicure','Gel','Acrylic','Nail Art','Other']
const EMOJI = { Manicure:'💅', Pedicure:'🦶', 'Nail Art':'🎨', Gel:'✨', Acrylic:'💎', Other:'🌸' }

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')
  const [cat,      setCat]      = useState('All')

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await servicesAPI.getAll()
      setServices(res.data.data)
      setFiltered(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load services. Is the backend running?')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let r = [...services]
    if (cat !== 'All') r = r.filter(s => s.category === cat)
    if (search.trim()) r = r.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(r)
  }, [search, cat, services])

  if (loading) return <LoadingPage text="Loading services..." />
  if (error)   return (
    <div style={{padding:'40px 24px'}}>
      <ErrorMessage message={error} onRetry={load}/>
    </div>
  )

  return (
    <div className="services-page">
      <div className="page-hero">
        <div className="page-hero-orb"/>
        <p className="eyebrow">What We Offer</p>
        <h1>Our Services</h1>
        <p className="sub">Choose from our range of premium nail treatments.</p>
      </div>

      <div className="services-container">
        <div className="controls">
          <div className="search-box">
            <Search size={16}/>
            <input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)}/>
            {search && <button style={{background:'none',color:'var(--grey)',display:'flex'}} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="cat-filters">
            <Filter size={14} style={{color:'var(--grey)'}}/>
            {CATEGORIES.map(c => (
              <button key={c} className={`cat-btn ${cat===c?'active':''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        <p className="result-count">{filtered.length} service{filtered.length!==1?'s':''} found</p>

        <div className="svc-list">
          {filtered.length === 0 ? (
            <div className="no-results">
              <span>🔍</span>
              <p>No services match your search.</p>
            </div>
          ) : filtered.map((svc, i) => (
            <div key={svc._id} className="svc-row fade-up" style={{animationDelay:`${i*0.06}s`}}>
              <div className="svc-row-icon">{EMOJI[svc.category]||'💅'}</div>
              <div className="svc-row-body">
                <div className="svc-row-top">
                  <div>
                    <h3>{svc.name}</h3>
                    <span className="svc-cat-badge">{svc.category}</span>
                  </div>
                  <div className="svc-row-price">${svc.price}</div>
                </div>
                <p className="svc-row-desc">{svc.description}</p>
                <div className="svc-row-footer">
                  <span className="dur-badge"><Clock size={13}/> {svc.duration} min</span>
                  <div className="svc-row-actions">
                    <Link to={`/services/${svc._id}`} className="btn-ghost">Details</Link>
                    <Link to={`/book?serviceId=${svc._id}`} className="btn-sm-primary">Book Now</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
