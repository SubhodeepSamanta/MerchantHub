import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/endpoints'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)

  const { token, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [token, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Must be a valid email'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone must be exactly 10 digits'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')
    if (!validate()) return

    setLoading(true)
    try {
      await register({
        businessName: formData.businessName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const serverFieldErrors = err?.response?.data?.fieldErrors
      if (serverFieldErrors) {
        setErrors((prev) => ({ ...prev, ...serverFieldErrors }))
      }
      setGeneralError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-5 h-5 rounded bg-accent text-white text-xs font-semibold flex items-center justify-center select-none shrink-0">
            M
          </div>
          <span className="text-[15px] font-semibold text-ink tracking-tight">
            MerchantHub
          </span>
        </div>

        <div className="bg-surface border border-line rounded-md p-6">
          <h1 className="text-[20px] font-semibold text-ink leading-tight mb-5">
            Create merchant account
          </h1>

          {generalError ? (
            <div className="mb-4 p-2.5 rounded bg-danger-bg text-danger-text text-xs border border-danger-text/20">
              {generalError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Business name"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Samanta Electronics"
              required
              error={errors.businessName}
            />

            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@business.com"
              required
              autoComplete="email"
              error={errors.email}
            />

            <Input
              label="Phone number"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              helperText="10-digit mobile number"
              required
              error={errors.phone}
            />

            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
              autoComplete="new-password"
              error={errors.password}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-1"
            >
              Register
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-ink font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
