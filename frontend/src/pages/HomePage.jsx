import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock, MapPin, MessageCircle, Star, ChevronRight } from 'lucide-react'
import { servicesAPI, availabilityAPI } from '../services/api'
import { format } from 'date-fns'
import './HomePage.css'

const CATEGORY_EMOJI = { Manicure:'💅', Pedicure:'🦶', 'Nail Art':'🎨', Gel:'✨', Acrylic:'💎', Other:'🌸' }

export default function HomePage() {
  const [services, setServices] = useState([])
  const [todaySlots, setTodaySlots] = useState(null)

  useEffect(() => {
    servicesAPI.getAll()
      .then(r => setServices(r.data.data.slice(0, 6)))
      .catch(err => console.warn('Could not load services:', err.message))
    const today = format(new Date(), 'yyyy-MM-dd')
    availabilityAPI.getSlots(today)
      .then(r => {
        const slots = r.data.slots || []
        setTodaySlots({ free: slots.filter(s=>s.available).length, total: slots.length })
      })
      .catch(() => {}) // silently fail — not critical for home page
  }, [])

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
        </div>
        <div className="hero-content fade-up">
          <div className="hero-badge">
            <Sparkles size={14} /> Premium Nail Studio
          </div>
          <h1 className="hero-title">
            Nissrine Nails Shop<br />
            <em>By Nissrine Bou Zeid</em>
          </h1>
          <p className="hero-sub">
            Luxurious nail care crafted with precision in the heart of Zahle, Lebanon. From classic manicures to bespoke nail art — your perfect nails await.
          </p>
          <div className="hero-actions">
            <Link to="/book" className="btn-primary">
              Book Appointment <ArrowRight size={16} />
            </Link>
            <Link to="/services" className="btn-outline">
              View Services
            </Link>
          </div>

          {todaySlots && (
            <div className="hero-avail">
              <div className="avail-dot" />
              <span>
                <strong>{todaySlots.free}</strong> slots available today
              </span>
              <Link to="/book">Book now →</Link>
            </div>
          )}
        </div>
        <div className="hero-visual fade-in">
          <div className="hero-photos">
            <div className="hero-photo-main">
              <img
                src="/images/nail-hero.jpg"
                alt="Pink shimmer gel manicure by Nissrine"
              />
              <div className="hero-photo-badge">
                <span>💅</span>
                <div>
                  <strong>Gel Manicure</strong>
                  <span>Lasts up to 3 weeks</span>
                </div>
              </div>
            </div>
            <div className="hero-photo-grid">
              <div className="hero-photo-small">
                <img src="/images/nail-small-1.jpg" alt="Bold red nails"/>
              </div>
              <div className="hero-photo-small">
                <img src="/images/nail-small-2.jpg" alt="Classic french manicure"/>
              </div>
              <div className="hero-photo-small">
                <img src="/images/nail-small-3.jpg" alt="Mauve rose nails"/>
              </div>
              <div className="hero-photo-small">
                <img src="/images/nail-small-4.jpg" alt="Glitter nail art"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stat"><strong>500+</strong><span>Happy Clients</span></div>
        <div className="stat-divider" />
        <div className="stat"><strong>8+</strong><span>Services</span></div>
        <div className="stat-divider" />
        <div className="stat"><strong>5★</strong><span>Rated</span></div>
        <div className="stat-divider" />
        <div className="stat"><strong>6+</strong><span>Years Experience</span></div>
      </section>

      {/* Services Grid */}
      <section className="section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">What We Offer</p>
            <h2 className="section-title">Our Services</h2>
          </div>
          <Link to="/services" className="see-all">See all services <ChevronRight size={16}/></Link>
        </div>

        <div className="services-grid">
          {services.map((svc, i) => (
            <Link to={`/services/${svc._id}`} key={svc._id} className="svc-card fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="svc-card-icon">{CATEGORY_EMOJI[svc.category] || '💅'}</div>
              <div className="svc-card-body">
                <h3>{svc.name}</h3>
                <p>{svc.description}</p>
              </div>
              <div className="svc-card-footer">
                <span className="svc-duration"><Clock size={13}/> {svc.duration} min</span>
                <span className="svc-price">${svc.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-banner">
        <div className="cta-inner">
          <h2>Ready for Perfect Nails?</h2>
          <p>Book your appointment in seconds and receive WhatsApp confirmation.</p>
          <Link to="/book" className="btn-primary btn-lg">
            Book Your Appointment <ArrowRight size={18}/>
          </Link>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="section">
        <p className="section-eyebrow" style={{textAlign:'center'}}>Our Work</p>
        <h2 className="section-title" style={{textAlign:'center', marginBottom:'32px'}}>Gallery</h2>
        <div className="gallery-grid">
          {[
            { url:'/images/gallery-1.jpg', label:'Red French Tips' },
            { url:'/images/gallery-2.jpg', label:'White French' },
            { url:'/images/gallery-3.jpg', label:'Nude Pink Gel' },
            { url:'/images/gallery-4.jpg', label:'Pink French' },
            { url:'/images/gallery-5.jpg', label:'Deep Red Gel' },
            { url:'/images/gallery-6.jpg', label:'Floral Nail Art' },
          ].map((photo, i) => (
            <div key={i} className="gallery-item fade-up" style={{animationDelay:`${i*0.08}s`}}>
              <img src={photo.url} alt={photo.label} loading="lazy"/>
              <div className="gallery-overlay">
                <span>{photo.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <p className="section-eyebrow" style={{textAlign:'center'}}>Why Choose Us</p>
        <h2 className="section-title" style={{textAlign:'center', marginBottom:'40px'}}>The Studio Experience</h2>
        <div className="features-grid">
          {[
            { icon:'💎', title:'Premium Products', desc:'We use only top-tier, skin-safe nail products for lasting results.' },
            { icon:'📱', title:'WhatsApp Booking', desc:'Book online and receive instant confirmation directly on WhatsApp.' },
            { icon:'🎨', title:'Custom Nail Art', desc:'Our artists bring your vision to life with stunning bespoke designs.' },
            { icon:'⏰', title:'Punctual Service', desc:'We respect your time — appointments start exactly when scheduled.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info Strip */}
      <section className="info-strip">
        <a href="https://maps.google.com/maps?q=Zahle,Lebanon" target="_blank" rel="noopener noreferrer" className="info-item info-link"><MapPin size={18}/> Zahle, Lebanon</a>
        <div className="info-item"><Clock size={18}/> Mon–Fri 9AM–8PM · Sat 10AM–6PM</div>
        <div className="info-item"><MessageCircle size={18}/> WhatsApp confirmations sent instantly</div>
        <div className="info-item"><Star size={18}/> 5-star rated on Google</div>
      </section>
    </div>
  )
}
