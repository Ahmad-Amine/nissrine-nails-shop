import React, { createContext, useContext, useState, useEffect } from 'react'
import { settingsAPI } from '../services/api'

const SettingsContext = createContext(null)

// Default settings shown before the API responds
const DEFAULTS = {
  shopName:      'Nissrine Nails Shop',
  tagline:       'By Nissrine Bou Zeid',
  address:       'Zahle, Lebanon',
  googleMapsUrl: 'https://maps.google.com/maps?q=Zahle,Lebanon',
  email:         '',
  hoursWeekdays: 'Mon–Fri: 9 AM – 8 PM',
  hoursSaturday: 'Saturday: 10 AM – 6 PM',
  hoursSunday:   '',
  phone:         '',
  whatsapp:      '',
  facebook:      '',
  instagram:     '',
  tiktok:        '',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading,  setLoading]  = useState(true)

  const reload = () => {
    settingsAPI.get()
      .then(r => setSettings({ ...DEFAULTS, ...r.data.data }))
      .catch(() => {}) // silently use defaults if backend offline
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading, reload }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
