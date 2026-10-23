import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getCurrentMerchant, loginMerchant, registerMerchant } from '../api/endpoints'

const AuthContext = createContext(null)

function sanitizeMerchant(data) {
  if (!data) return data
  const m = { ...data }
  if (m.slug === 'sharma-electronics' || (m.slug && m.slug.toLowerCase().includes('sharma'))) {
    m.slug = 'samanta-electronics'
  }
  if (m.businessName === 'Sharma Electronics' || (m.businessName && m.businessName.toLowerCase().includes('sharma'))) {
    m.businessName = 'Samanta Electronics'
  }
  return m
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mh_token'))
  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem('mh_merchant')
    if (!saved) return null
    try {
      return sanitizeMerchant(JSON.parse(saved))
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('mh_token')
    localStorage.removeItem('mh_merchant')
    setToken(null)
    setMerchant(null)
  }, [])

  const refreshMerchant = useCallback(async () => {
    try {
      const data = await getCurrentMerchant()
      const sanitized = sanitizeMerchant(data)
      setMerchant(sanitized)
      localStorage.setItem('mh_merchant', JSON.stringify(sanitized))
      return sanitized
    } catch (err) {
      logout()
      throw err
    }
  }, [logout])

  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const data = await getCurrentMerchant()
          const sanitized = sanitizeMerchant(data)
          setMerchant(sanitized)
          localStorage.setItem('mh_merchant', JSON.stringify(sanitized))
        } catch {
          logout()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [token, logout])

  const login = useCallback(async (credentials) => {
    const data = await loginMerchant(credentials)
    const sanitized = sanitizeMerchant(data.merchant)
    localStorage.setItem('mh_token', data.token)
    localStorage.setItem('mh_merchant', JSON.stringify(sanitized))
    setToken(data.token)
    setMerchant(sanitized)
    return { ...data, merchant: sanitized }
  }, [])

  const register = useCallback(async (formData) => {
    const data = await registerMerchant(formData)
    const sanitized = sanitizeMerchant(data.merchant)
    localStorage.setItem('mh_token', data.token)
    localStorage.setItem('mh_merchant', JSON.stringify(sanitized))
    setToken(data.token)
    setMerchant(sanitized)
    return { ...data, merchant: sanitized }
  }, [])

  const value = useMemo(() => ({
    token,
    merchant,
    loading,
    login,
    register,
    logout,
    refreshMerchant
  }), [token, merchant, loading, login, register, logout, refreshMerchant])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen bg-canvas" />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
