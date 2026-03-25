import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register:          (data)     => api.post('/auth/register', data),
  login:             (data)     => api.post('/auth/login', data),
  me:                ()         => api.get('/auth/me'),
  seedAdmin:         ()         => api.get('/auth/seed-admin'),
  getAllUsers:        (params)   => api.get('/auth/users', { params }),
  resetUserPassword: (id, data) => api.put(`/auth/users/${id}/reset-password`, data),
}

export const servicesAPI = {
  getAll:  ()   => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  seed:    ()   => api.get('/services/seed'),
}

export const appointmentsAPI = {
  getMine:      ()              => api.get('/appointments/my'),
  getAll:       ()              => api.get('/appointments/all'),
  getRevenue:   ()              => api.get('/appointments/revenue'),
  create:       (data)          => api.post('/appointments', data),
  phoneBooking: (data)          => api.post('/appointments/phone-booking', data),
  cancel:       (id)            => api.put(`/appointments/${id}/cancel`),
  confirm:      (id, adminNote) => api.put(`/appointments/${id}/confirm`, { adminNote }),
  reject:       (id, adminNote) => api.put(`/appointments/${id}/reject`, { adminNote }),
  markPaid:     (id, data)      => api.put(`/appointments/${id}/mark-paid`, data),
}

export const availabilityAPI = {
  getSlots:           (date)     => api.get(`/availability/${date}`),
  getMonth:           ()         => api.get('/availability/month'),
  seedHours:          ()         => api.get('/availability/seed-hours'),
  getWorkingHours:    ()         => api.get('/availability/working-hours'),
  updateWorkingHours: (day, data)=> api.put(`/availability/working-hours/${day}`, data),
  getDateOverrides:   ()         => api.get('/availability/date-overrides'),
  setDateOverride:    (data)     => api.post('/availability/date-overrides', data),
  removeDateOverride: (id)       => api.delete(`/availability/date-overrides/${id}`),
  getClosedDates:     ()         => api.get('/availability/closed-dates'),
  addClosedDate:      (data)     => api.post('/availability/closed-dates', data),
  removeClosedDate:   (id)       => api.delete(`/availability/closed-dates/${id}`),
}

export const settingsAPI = {
  get:    ()     => api.get('/settings'),
  update: (data) => api.put('/settings', data),
}

export const adminServicesAPI = {
  create: (data)     => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id)       => api.delete(`/services/${id}`),
}

export default api
