import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage        from './pages/HomePage'
import ServicesPage    from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import BookingPage     from './pages/BookingPage'
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import AdminPage       from './pages/AdminPage'
import NotFoundPage     from './pages/NotFoundPage'
import ErrorBoundary from './components/ErrorBoundary'
import { servicesAPI, availabilityAPI, authAPI } from './services/api'

// Protected route — must be logged in
function Private({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div className="spinner"/></div>
  return user ? children : <Navigate to="/login" replace />
}

// Admin-only route
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh'}}><div className="spinner"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function AppInner() {
  useEffect(() => {
    servicesAPI.seed().catch(() => {})
    availabilityAPI.seedHours().catch(() => {})
    authAPI.seedAdmin().catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 72px)' }}>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/services"  element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/book"      element={<Private><BookingPage /></Private>} />
          <Route path="/dashboard" element={<Private><DashboardPage /></Private>} />
          <Route path="/admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="*"          element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-center" toastOptions={{
              style: { fontFamily:'var(--font-body)', background:'#fff', color:'var(--dark)', borderLeft:'4px solid var(--primary)', borderRadius:'12px' },
              success: { iconTheme: { primary:'var(--primary)', secondary:'#fff' } }
            }}/>
            <AppInner />
          </BrowserRouter>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}
