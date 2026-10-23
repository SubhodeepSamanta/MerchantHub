import { useState, useEffect, useMemo } from 'react'
import { Check, X } from 'lucide-react'
import {
  getAdvances,
  getAdvanceEligibility,
  applyForAdvance,
  getErrorMessage
} from '../api/endpoints'
import { formatINR, formatDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import StatusBadge from '../components/ui/StatusBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

export default function Advances() {
  const [advances, setAdvances] = useState([])
  const [eligibility, setEligibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [applyAmount, setApplyAmount] = useState('')
  const [applyError, setApplyError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        const [advancesData, eligData] = await Promise.all([
          getAdvances(),
          getAdvanceEligibility()
        ])
        if (!ignore) {
          setAdvances(Array.isArray(advancesData) ? advancesData : [])
          setEligibility(eligData)
          setError('')
        }
      } catch (err) {
        if (!ignore) {
          setError(getErrorMessage(err))
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [refreshKey])

  const reloadData = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  const activeAdvance = useMemo(() => {
    return advances.find((a) => a.status === 'ACTIVE')
  }, [advances])

  const parsedAmount = Number(applyAmount) || 0
  const feeAmount = Math.round(parsedAmount * 0.05 * 100) / 100
  const totalRepayable = parsedAmount + feeAmount

  const handleUseMaximum = () => {
    if (eligibility?.eligibleAmount) {
      setApplyAmount(String(eligibility.eligibleAmount))
      setApplyError('')
    }
  }

  const handleApplyClick = (e) => {
    e.preventDefault()
    setApplyError('')
    const max = eligibility?.eligibleAmount || 0
    if (!applyAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setApplyError('Enter a valid amount')
      return
    }
    if (parsedAmount > max) {
      setApplyError(`Amount cannot exceed ${formatINR(max)}`)
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmAdvance = async () => {
    setSubmitting(true)
    try {
      await applyForAdvance(parsedAmount)
      toast.success('Advance disbursed')
      setConfirmOpen(false)
      setApplyAmount('')
      reloadData()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      header: 'Date',
      key: 'createdAt',
      render: (row) => (
        <span className="font-mono text-muted text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      )
    },
    {
      header: 'Principal',
      key: 'principal',
      align: 'right',
      render: (row) => formatINR(row.principal)
    },
    {
      header: 'Total repayable',
      key: 'totalRepayable',
      align: 'right',
      render: (row) => formatINR(row.totalRepayable)
    },
    {
      header: 'Repaid',
      key: 'amountRepaid',
      align: 'right',
      render: (row) => formatINR(row.amountRepaid)
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cash Advance"
        description="Flexible funding repaid automatically from your daily sales"
      />

      <div className="border border-line rounded-md bg-surface p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted">Factor rate:</span>
          <span className="font-medium text-ink">1.05 (5% one-time fee)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">Auto repayment:</span>
          <span className="font-medium text-ink">10% of each payment</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted">Limit:</span>
          <span className="font-medium text-ink">One active advance at a time</span>
        </div>
      </div>

      {loading && advances.length === 0 && !eligibility ? (
        <div className="border border-line rounded-md bg-surface p-12 text-center">
          <div className="h-6 w-32 bg-neutral-bg animate-pulse mx-auto rounded" />
        </div>
      ) : error && advances.length === 0 && !eligibility ? (
        <div className="border border-line rounded-md bg-surface p-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" onClick={reloadData}>
            Try again
          </Button>
        </div>
      ) : activeAdvance ? (
        <div className="border border-line rounded-md bg-surface p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Outstanding balance
              </span>
              <p className="font-mono text-3xl font-semibold text-ink tabular-nums mt-1">
                {formatINR(activeAdvance.outstanding)}
              </p>
            </div>
            <StatusBadge status={activeAdvance.status} />
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted mb-1.5 font-mono tabular-nums">
              <span>
                Repaid {formatINR(activeAdvance.amountRepaid)} of {formatINR(activeAdvance.totalRepayable)}
              </span>
              <span>
                {Math.min(
                  100,
                  Math.round(
                    (activeAdvance.amountRepaid / (activeAdvance.totalRepayable || 1)) * 100
                  )
                )}
                %
              </span>
            </div>
            <div className="w-full h-1 bg-neutral-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-150"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (activeAdvance.amountRepaid / (activeAdvance.totalRepayable || 1)) * 100
                    )
                  )}%`
                }}
              />
            </div>
          </div>

          <p className="text-xs text-muted mt-4">
            Repaying automatically: 10% of every successful payment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-line rounded-md bg-surface p-6 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Eligible amount
              </span>
              <p className="font-mono text-3xl font-semibold text-ink tabular-nums mt-1">
                {formatINR(eligibility?.eligibleAmount || 0)}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-2.5 text-[13px]">
                  {Number(eligibility?.successfulPaymentsLast30Days || 0) >= 5 ? (
                    <Check className="w-4 h-4 text-success-text shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-danger-text shrink-0" />
                  )}
                  <span className="text-ink">
                    Successful payments in last 30 days:{' '}
                    <span className="font-mono font-medium">
                      {eligibility?.successfulPaymentsLast30Days ?? 0} of 5 required
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-[13px]">
                  {Number(eligibility?.volumeLast30Days || 0) > 0 ? (
                    <Check className="w-4 h-4 text-success-text shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-danger-text shrink-0" />
                  )}
                  <span className="text-ink">
                    Payment volume in last 30 days:{' '}
                    <span className="font-mono font-medium">
                      {formatINR(eligibility?.volumeLast30Days || 0)}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {eligibility?.reason ? (
              <div className="mt-6 p-3 rounded-md bg-warning-bg text-warning-text text-xs border border-warning-text/20">
                {eligibility.reason}
              </div>
            ) : null}
          </div>

          {eligibility?.eligible && eligibility.eligibleAmount > 0 ? (
            <div className="border border-line rounded-md bg-surface p-6">
              <h3 className="text-sm font-semibold text-ink mb-4">
                Request an advance
              </h3>

              <form onSubmit={handleApplyClick} className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="advanceAmount" className="text-[13px] font-medium text-ink">
                      Amount
                    </label>
                    <button
                      type="button"
                      onClick={handleUseMaximum}
                      className="text-xs text-muted hover:text-ink transition-colors duration-150 cursor-pointer"
                    >
                      Use maximum
                    </button>
                  </div>
                  <Input
                    id="advanceAmount"
                    type="number"
                    prefix="₹"
                    min="1"
                    max={eligibility.eligibleAmount}
                    step="1"
                    value={applyAmount}
                    onChange={(e) => {
                      setApplyAmount(e.target.value)
                      setApplyError('')
                    }}
                    placeholder={String(eligibility.eligibleAmount)}
                    error={applyError}
                    required
                  />
                </div>

                <div className="border border-line rounded-md p-3.5 bg-canvas flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Advance amount</span>
                    <span className="font-mono text-ink">{formatINR(parsedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">One-time fee (5%)</span>
                    <span className="font-mono text-ink">{formatINR(feeAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1.5 border-t border-line">
                    <span className="text-ink">Total repayable</span>
                    <span className="font-mono text-ink">{formatINR(totalRepayable)}</span>
                  </div>
                  <div className="flex justify-between text-muted pt-1">
                    <span>Repayment</span>
                    <span>10% of each payment</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-1"
                  disabled={parsedAmount <= 0}
                >
                  Get advance
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-ink mb-3">Advance history</h2>
        {advances.length === 0 ? (
          <EmptyState message="No cash advances found in history." />
        ) : (
          <DataTable
            columns={columns}
            data={advances}
            emptyMessage="No cash advances found."
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Confirm cash advance"
        message={`Are you sure you want to take an advance of ${formatINR(
          parsedAmount
        )}? Total repayable will be ${formatINR(
          totalRepayable
        )}, deducted automatically as 10% of every future successful payment.`}
        confirmText="Get advance"
        loading={submitting}
        onConfirm={handleConfirmAdvance}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
