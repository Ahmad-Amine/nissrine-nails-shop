import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'70vh',padding:'40px',textAlign:'center'}}>
      <div style={{fontSize:'5rem',marginBottom:'16px'}}>💅</div>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:'2.5rem',color:'var(--dark)',marginBottom:'10px'}}>Page Not Found</h1>
      <p style={{color:'var(--grey)',marginBottom:'28px',maxWidth:'360px',lineHeight:'1.7'}}>
        The page you're looking for doesn't exist. Let's get you back to something beautiful.
      </p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  )
}
