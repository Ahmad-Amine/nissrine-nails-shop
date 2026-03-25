import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Tag, Star, CheckCircle, Info } from 'lucide-react'
import { servicesAPI } from '../services/api'
import { LoadingPage, ErrorMessage } from '../components/LoadingSpinner'
import './ServiceDetailPage.css'

const EMOJI = { Manicure:'💅', Pedicure:'🦶', 'Nail Art':'🎨', Gel:'✨', Acrylic:'💎', Other:'🌸' }
const INCLUDES = {
  Manicure:   ['Nail shaping & filing','Cuticle care & treatment','Relaxing hand massage','Polish of your choice'],
  Pedicure:   ['Foot soak & exfoliation','Nail shaping','Cuticle care','Leg & foot massage','Polish application'],
  Gel:        ['Gel base coat','Two gel color coats','UV/LED cure','Top coat — lasts up to 3 weeks'],
  Acrylic:    ['Nail tip application','Acrylic sculpting','Shaping & filing','Polish or gel finish'],
  'Nail Art': ['Custom design consultation','Freehand artwork','Gems & embellishments','Top coat sealer'],
  Other:      ['Professional treatment','Premium products used','Expert technician'],
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    servicesAPI.getById(id)
      .then(r => setService(r.data.data))
      .catch(err => {
        if (err.response?.status === 404) navigate('/services', { replace: true })
        else setError(err.response?.data?.message || 'Could not load service details.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingPage text="Loading service..." />
  if (error)   return <div style={{padding:'40px'}}><ErrorMessage message={error} onRetry={() => window.location.reload()}/></div>
  if (!service) return null

  return (
    <div className="detail-page">
      <div className="detail-back">
        <div className="detail-back-inner">
          <Link to="/services" className="back-link"><ArrowLeft size={16}/> All Services</Link>
        </div>
      </div>

      <div className="detail-hero">
        <div className="detail-hero-inner">
          <div className="detail-icon-wrap">
            <span className="detail-icon">{EMOJI[service.category]||'💅'}</span>
          </div>
          <div className="detail-hero-text">
            <span className="detail-cat">{service.category}</span>
            <h1>{service.name}</h1>
            <p>{service.description}</p>
            <div className="detail-meta">
              <span><Clock size={15}/> {service.duration} minutes</span>
              <span><Tag size={15}/> ${service.price}</span>
              <span><Star size={15}/> 5.0 rated</span>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <div className="detail-main">
          <div className="detail-card">
            <h2><CheckCircle size={18}/> What's Included</h2>
            <ul className="includes-list">
              {(INCLUDES[service.category]||INCLUDES.Other).map((item,i) => (
                <li key={i}><span className="include-dot"/>{item}</li>
              ))}
            </ul>
          </div>
          <div className="detail-tip">
            <Info size={18}/>
            <p>💡 We recommend arriving 5 minutes early. Please remove any old polish beforehand for best results.</p>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="price-card">
            <div className="price-top">
              <span className="price-label">Price</span>
              <span className="price-value">${service.price}</span>
            </div>
            <div className="price-row"><Clock size={14}/> {service.duration} minutes session</div>
            <div className="price-row">✨ Premium products</div>
            <div className="price-row">👩‍🎨 Expert technician</div>
            <Link to={`/book?serviceId=${service._id}`} className="btn btn-primary" style={{display:'flex',justifyContent:'center',marginTop:'20px'}}>
              Book This Service
            </Link>
            <Link to="/book" className="btn btn-outline" style={{display:'flex',justifyContent:'center',marginTop:'10px',fontSize:'0.9rem',padding:'12px 20px'}}>
              Browse Dates First
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
