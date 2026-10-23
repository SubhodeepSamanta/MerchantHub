import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../api/endpoints'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { token, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail('demo@merchanthub.in')
    setPassword('Demo@123')
    setError('')
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
            Sign in to MerchantHub
          </h1>

          {error ? (
            <div className="mb-4 p-2.5 rounded bg-danger-bg text-danger-text text-xs border border-danger-text/20">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-1"
            >
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-ink font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>

        <div className="mt-4 border border-line rounded-md bg-surface p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted">Demo account</p>
            <p className="text-xs font-mono text-ink mt-0.5">
              demo@merchanthub.in / Demo@123
            </p>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs font-medium text-ink hover:text-accent transition-colors duration-150 cursor-pointer ml-3 shrink-0"
          >
            Use demo account
          </button>
        </div>
      </div>
    </div>
  )
}
