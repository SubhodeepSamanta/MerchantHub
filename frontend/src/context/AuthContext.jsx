import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router'
import { getCurrentMerchant, loginMerchant, registerMerchant } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mh_token'))
  const [merchant, setMerchant] = useState(() => {
    const saved = localStorage.getItem('mh_merchant')
    if (!saved) return null
    try {
      const parsed = JSON.parse(saved)
      if (parsed) {
        if (parsed.slug === 'sharma-electronics') parsed.slug = 'samanta-electronics'
        if (parsed.businessName === 'Sharma Electronics') parsed.businessName = 'Samanta Electronics'
      }
      return parsed
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
      setMerchant(data)
      localStorage.setItem('mh_merchant', JSON.stringify(data))
      return data
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
          setMerchant(data)
          localStorage.setItem('mh_merchant', JSON.stringify(data))
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
    localStorage.setItem('mh_token', data.token)
    localStorage.setItem('mh_merchant', JSON.stringify(data.merchant))
    setToken(data.token)
    setMerchant(data.merchant)
    return data
  }, [])

  const register = useCallback(async (formData) => {
    const data = await registerMerchant(formData)
    localStorage.setItem('mh_token', data.token)
    localStorage.setItem('mh_merchant', JSON.stringify(data.merchant))
    setToken(data.token)
    setMerchant(data.merchant)
    return data
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
