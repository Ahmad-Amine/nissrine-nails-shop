import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('App Error:', error, info) }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',padding:'40px',textAlign:'center'}}>
        <div style={{fontSize:'4rem',marginBottom:'16px'}}>😕</div>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:'1.8rem',color:'var(--dark)',marginBottom:'10px'}}>Something went wrong</h2>
        <p style={{color:'var(--grey)',marginBottom:'24px',maxWidth:'400px'}}>
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
          style={{background:'var(--primary)',color:'#fff',border:'none',padding:'12px 28px',borderRadius:'30px',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:'600'}}
        >
          Go back home
        </button>
      </div>
    )
  }
}
