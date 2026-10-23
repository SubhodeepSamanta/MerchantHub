import { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Lock, Check, X } from 'lucide-react'
import {
  getPublicMerchant,
  createPublicPayment,
  getErrorMessage
} from '../api/endpoints'
import { formatINR, formatDateTime } from '../utils/format'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Checkout() {
  const { slug } = useParams()
  const [merchant, setMerchant] = useState(null)
  const [notFound, setNotFound] = useState(!slug)
  const [loadingMerchant, setLoadingMerchant] = useState(Boolean(slug))

  const [amount, setAmount] = useState('')
  const [payerVpa, setPayerVpa] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)

  useEffect(() => {
    let ignore = false

    async function fetchMerchant() {
      try {
        const data = await getPublicMerchant(slug)
        if (!ignore) {
          setMerchant(data)
          setNotFound(false)
        }
      } catch {
        if (!ignore) {
          setNotFound(true)
        }
      } finally {
        if (!ignore) {
          setLoadingMerchant(false)
        }
      }
    }

    if (slug) {
      fetchMerchant()
    }

    return () => {
      ignore = true
    }
  }, [slug])

  const validate = () => {
    const errs = {}
    const parsed = Number(amount)
    if (!amount || isNaN(parsed) || parsed < 1 || parsed > 100000) {
      errs.amount = 'Amount must be between ₹1 and ₹1,00,000'
    }
    if (!payerVpa.trim() || !payerVpa.includes('@')) {
      errs.payerVpa = 'Enter a valid UPI ID (e.g. rahul@okaxis)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setErrors({})
    try {
      const res = await createPublicPayment(slug, {
        amount: Number(amount),
        payerVpa: payerVpa.trim()
      })
      setPaymentResult(res)
    } catch (err) {
      const msg = getErrorMessage(err)
      setPaymentResult({
        status: 'FAILED',
        errorMessage: msg
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setPaymentResult(null)
    setAmount('')
    setPayerVpa('')
    setErrors({})
  }

  if (loadingMerchant) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-surface border border-line rounded-md p-6 text-center">
          <div className="w-10 h-10 rounded-md bg-neutral-bg animate-pulse mx-auto mb-4" />
          <div className="h-4 w-32 bg-neutral-bg animate-pulse mx-auto rounded mb-2" />
          <div className="h-3 w-48 bg-neutral-bg animate-pulse mx-auto rounded" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-surface border border-line rounded-md p-8 text-center">
          <p className="text-sm text-muted">
            This payment link is not valid.
          </p>
        </div>
      </div>
    )
  }

  const parsedAmount = Number(amount)
  const payButtonLabel = parsedAmount > 0
    ? `Pay ${formatINR(parsedAmount)}`
    : 'Pay'

  const merchantInitial = (merchant?.businessName || 'M').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-surface border border-line rounded-md p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-line">
          <div className="w-10 h-10 rounded-md bg-accent text-white text-lg font-semibold flex items-center justify-center select-none shrink-0">
            {merchantInitial}
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-ink leading-tight truncate">
              {merchant?.businessName}
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Payment to verified merchant
            </p>
          </div>
        </div>

        {paymentResult ? (
          paymentResult.status === 'SUCCESS' ? (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-success-bg text-success-text flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-base font-semibold text-ink mt-3">
                Payment successful
              </h2>
              <p className="font-mono text-2xl font-semibold text-ink tabular-nums mt-1">
                {formatINR(paymentResult.amount || parsedAmount)}
              </p>
              <p className="text-xs text-muted mt-1">
                Paid to {merchant?.businessName}
              </p>
              <div className="text-xs font-mono text-muted mt-4 py-2 border-t border-b border-line w-full text-center">
                Payment #{paymentResult.id} · {formatDateTime(paymentResult.createdAt || new Date())}
              </div>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="mt-5"
              >
                Make another payment
              </Button>
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-danger-bg text-danger-text flex items-center justify-center">
                <X className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-base font-semibold text-ink mt-3">
                Payment declined
              </h2>
              <p className="text-xs text-muted mt-1 max-w-xs">
                {paymentResult.errorMessage || 'The payment could not be processed.'}
              </p>
              <Button
                variant="secondary"
                onClick={handleReset}
                className="mt-5"
              >
                Try again
              </Button>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <Input
              label="Amount to pay"
              id="amount"
              type="number"
              prefix="₹"
              min="1"
              max="100000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500.00"
              required
              error={errors.amount}
            />

            <Input
              label="Your UPI ID"
              id="payerVpa"
              type="text"
              value={payerVpa}
              onChange={(e) => setPayerVpa(e.target.value)}
              placeholder="rahul@okaxis"
              helperText="Funds will be debited from this UPI ID"
              required
              error={errors.payerVpa}
            />

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              className="w-full mt-2"
            >
              {payButtonLabel}
            </Button>
          </form>
        )}

        <div className="text-xs text-muted flex items-center justify-center gap-1.5 mt-5 pt-4 border-t border-line/60">
          <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
          <span>Secured by MerchantHub</span>
        </div>
      </div>
    </div>
  )
}
