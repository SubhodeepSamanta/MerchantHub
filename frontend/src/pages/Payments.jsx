import { useState, useEffect } from 'react'
import {
  getPayments,
  createPayment,
  refundPayment,
  getErrorMessage
} from '../api/endpoints'
import { formatINR, formatDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import StatusBadge from '../components/ui/StatusBadge'
import SidePanel from '../components/ui/SidePanel'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import EmptyState from '../components/ui/EmptyState'

const STATUS_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'SUCCESS', label: 'Success' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'REFUNDED', label: 'Refunded' }
]

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [collectPanelOpen, setCollectPanelOpen] = useState(false)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectPayerVpa, setCollectPayerVpa] = useState('')
  const [collectNote, setCollectNote] = useState('')
  const [collectErrors, setCollectErrors] = useState({})
  const [collectLoading, setCollectLoading] = useState(false)

  const [selectedPayment, setSelectedPayment] = useState(null)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundLoading, setRefundLoading] = useState(false)

  const { toast } = useToast()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const data = await getPayments(page, 20, statusFilter)
        if (!ignore) {
          setPayments(data?.content || [])
          setTotalPages(data?.totalPages ?? 1)
          setTotalElements(data?.totalElements ?? 0)
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

    load()

    return () => {
      ignore = true
    }
  }, [page, statusFilter, refreshKey])

  const handleTabChange = (newStatus) => {
    setLoading(true)
    setStatusFilter(newStatus)
    setPage(0)
  }

  const handlePageChange = (newPage) => {
    setLoading(true)
    setPage(newPage)
  }

  const reloadPayments = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  const handleOpenCollect = () => {
    setCollectAmount('')
    setCollectPayerVpa('')
    setCollectNote('')
    setCollectErrors({})
    setCollectPanelOpen(true)
  }

  const validateCollect = () => {
    const errs = {}
    const num = Number(collectAmount)
    if (!collectAmount || isNaN(num) || num < 1 || num > 100000) {
      errs.amount = 'Amount must be between ₹1 and ₹1,00,000'
    }
    if (!collectPayerVpa.trim() || !collectPayerVpa.includes('@')) {
      errs.payerVpa = 'Enter a valid UPI ID (e.g. rahul@okaxis)'
    }
    setCollectErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCollectSubmit = async (e) => {
    e.preventDefault()
    if (!validateCollect()) return

    setCollectLoading(true)
    try {
      const res = await createPayment({
        amount: Number(collectAmount),
        payerVpa: collectPayerVpa.trim(),
        note: collectNote.trim() || undefined
      })
      if (res?.status === 'SUCCESS') {
        toast.success('Payment received')
      } else if (res?.status === 'FAILED') {
        toast.error('Payment declined')
      } else {
        toast.success('Payment processed')
      }
      setCollectPanelOpen(false)
      setPage(0)
      reloadPayments()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setCollectLoading(false)
    }
  }

  const handleRefundConfirm = async () => {
    if (!selectedPayment) return
    setRefundLoading(true)
    try {
      await refundPayment(selectedPayment.id)
      toast.success('Payment refunded')
      setRefundDialogOpen(false)
      setSelectedPayment(null)
      reloadPayments()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setRefundLoading(false)
    }
  }

  const columns = [
    {
      header: 'Payment',
      key: 'id',
      render: (row) => <span className="font-mono text-muted">#{row.id}</span>
    },
    {
      header: 'Customer UPI',
      key: 'payerVpa',
      render: (row) => <span className="font-mono">{row.payerVpa}</span>
    },
    {
      header: 'Note',
      key: 'note',
      render: (row) => (
        <span className="text-muted truncate max-w-[180px] block">
          {row.note || '—'}
        </span>
      )
    },
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
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Amount',
      key: 'amount',
      align: 'right',
      render: (row) => formatINR(row.amount)
    }
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payments"
        description="Manage and collect customer payments"
        action={
          <Button variant="primary" onClick={handleOpenCollect}>
            Collect payment
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <div className="inline-flex border border-line rounded-md bg-canvas p-0.5">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1 text-xs rounded transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'bg-surface text-ink font-medium border border-line/50 shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && payments.length === 0 ? (
        <div className="border border-line rounded-md bg-surface p-12 text-center">
          <div className="h-6 w-32 bg-neutral-bg animate-pulse mx-auto rounded" />
        </div>
      ) : error && payments.length === 0 ? (
        <div className="border border-line rounded-md bg-surface p-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted">{error}</p>
          <Button
            variant="secondary"
            onClick={reloadPayments}
          >
            Try again
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          message={
            statusFilter === 'ALL'
              ? 'No payments collected yet.'
              : `No ${statusFilter.toLowerCase()} payments found.`
          }
          actionText={statusFilter === 'ALL' ? 'Collect payment' : undefined}
          onAction={statusFilter === 'ALL' ? handleOpenCollect : undefined}
        />
      ) : (
        <div>
          <DataTable
            columns={columns}
            data={payments}
            onRowClick={(row) => setSelectedPayment(row)}
            emptyMessage="No payments found."
          />
          <Pagination
            page={page}
            size={20}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <SidePanel
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
        title="Payment details"
      >
        {selectedPayment ? (
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col gap-5">
              <div className="pb-4 border-b border-line">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                  Amount
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-2xl font-semibold text-ink tabular-nums">
                    {formatINR(selectedPayment.amount)}
                  </span>
                  <StatusBadge status={selectedPayment.status} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5 text-[13px]">
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Payment ID</span>
                  <span className="font-mono text-ink">#{selectedPayment.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Customer UPI</span>
                  <span className="font-mono text-ink">{selectedPayment.payerVpa}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Note</span>
                  <span className="text-ink">{selectedPayment.note || 'None'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-line/50">
                  <span className="text-muted">Date & time</span>
                  <span className="font-mono text-ink text-xs">
                    {formatDateTime(selectedPayment.createdAt)}
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-muted block mb-1">Idempotency key</span>
                  <span className="font-mono text-xs text-muted break-all bg-canvas p-2 rounded border border-line block select-all">
                    {selectedPayment.idempotencyKey}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-line mt-6">
              {selectedPayment.status === 'SUCCESS' ? (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => setRefundDialogOpen(true)}
                >
                  Refund payment
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </SidePanel>

      <SidePanel
        isOpen={collectPanelOpen}
        onClose={() => setCollectPanelOpen(false)}
        title="Collect payment"
      >
        <form onSubmit={handleCollectSubmit} className="flex flex-col justify-between h-full">
          <div className="flex flex-col gap-4">
            <Input
              label="Amount"
              id="collectAmount"
              type="number"
              prefix="₹"
              min="1"
              max="100000"
              step="0.01"
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
              placeholder="500.00"
              required
              error={collectErrors.amount}
            />

            <Input
              label="Customer UPI ID"
              id="collectPayerVpa"
              value={collectPayerVpa}
              onChange={(e) => setCollectPayerVpa(e.target.value)}
              placeholder="customer@okhdfcbank"
              required
              error={collectErrors.payerVpa}
            />

            <Input
              label="Note (optional)"
              id="collectNote"
              value={collectNote}
              onChange={(e) => setCollectNote(e.target.value)}
              placeholder="Order #1042"
            />

            <p className="text-xs text-muted leading-relaxed p-3 rounded-md bg-canvas border border-line">
              Tip: a UPI ID containing &quot;fail&quot; simulates a declined payment.
            </p>
          </div>

          <div className="pt-6 border-t border-line mt-6 flex gap-2">
            <Button
              variant="secondary"
              className="w-1/2"
              onClick={() => setCollectPanelOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={collectLoading}
              className="w-1/2"
            >
              Collect
            </Button>
          </div>
        </form>
      </SidePanel>

      <ConfirmDialog
        isOpen={refundDialogOpen}
        title="Refund payment"
        message={`Are you sure you want to refund ${
          selectedPayment ? formatINR(selectedPayment.amount) : ''
        } to ${selectedPayment?.payerVpa || ''}? This will issue a full refund and deduct the amount from your wallet.`}
        confirmText="Refund"
        confirmVariant="danger"
        loading={refundLoading}
        onConfirm={handleRefundConfirm}
        onCancel={() => setRefundDialogOpen(false)}
      />
    </div>
  )
}
