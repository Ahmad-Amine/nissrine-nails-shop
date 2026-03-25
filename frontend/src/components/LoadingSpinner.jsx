import React from 'react'
import './LoadingSpinner.css'

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="ls-wrap">
      <div className="spinner" />
      {text && <p className="ls-text">{text}</p>}
    </div>
  )
}

export function LoadingPage({ text = 'Loading...' }) {
  return (
    <div className="ls-page">
      <div className="spinner" />
      <p className="ls-text">{text}</p>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-msg">
      <span>⚠️</span>
      <p>{message || 'Something went wrong.'}</p>
      {onRetry && <button className="btn btn-outline btn-sm" onClick={onRetry}>Try Again</button>}
    </div>
  )
}

export function EmptyState({ emoji = '📋', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <span className="es-emoji">{emoji}</span>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {action}
    </div>
  )
}
