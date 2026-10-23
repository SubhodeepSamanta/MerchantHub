import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { getLedger, exportLedgerCsv, getErrorMessage } from '../api/endpoints'
import { formatINR, formatDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'
import PageHeader from '../components/ui/PageHeader'
import DataTable from '../components/ui/DataTable'
import Pagination from '../components/ui/Pagination'
import Button from '../components/ui/Button'

function formatLedgerDescription(reason, referenceId) {
  switch (reason) {
    case 'PAYMENT':
      return `Payment received · #${referenceId}`
    case 'REFUND':
      return `Refund issued · #${referenceId}`
    case 'ADVANCE_DISBURSAL':
      return `Cash advance disbursed · #${referenceId}`
    case 'ADVANCE_REPAYMENT':
      return `Advance repayment · #${referenceId}`
    default:
      return `${reason || 'Transaction'} · #${referenceId || '—'}`
  }
}

export default function Ledger() {
  const [entries, setEntries] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const { toast } = useToast()

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const data = await getLedger(page, 20)
        if (!ignore) {
          setEntries(data?.content || [])
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
  }, [page, refreshKey])

  const handlePageChange = (newPage) => {
    setLoading(true)
    setPage(newPage)
  }

  const reloadLedger = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      await exportLedgerCsv()
      toast.success('Ledger exported')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setExportLoading(false)
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
      header: 'Description',
      key: 'description',
      render: (row) => (
        <span className="font-medium text-ink">
          {formatLedgerDescription(row.reason, row.referenceId)}
        </span>
      )
    },
    {
      header: 'Type',
      key: 'entryType',
      render: (row) => (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-neutral-bg text-neutral-text font-medium">
          {row.entryType}
        </span>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (row) => {
        const isCredit = row.entryType === 'CREDIT'
        return (
          <span
            className={`font-mono tabular-nums font-medium ${
              isCredit ? 'text-accent' : 'text-ink'
            }`}
          >
            {isCredit ? '+' : '−'}
            {formatINR(row.amount)}
          </span>
        )
      }
    },
    {
      header: 'Balance after',
      key: 'balanceAfter',
      align: 'right',
      render: (row) => formatINR(row.balanceAfter)
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ledger"
        description="Audit trail of all wallet transactions"
        action={
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exportLoading}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {loading && entries.length === 0 ? (
        <div className="border border-line rounded-md bg-surface p-12 text-center">
          <div className="h-6 w-32 bg-neutral-bg animate-pulse mx-auto rounded" />
        </div>
      ) : error && entries.length === 0 ? (
        <div className="border border-line rounded-md bg-surface p-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted">{error}</p>
          <Button variant="secondary" onClick={reloadLedger}>
            Try again
          </Button>
        </div>
      ) : (
        <div>
          <DataTable
            columns={columns}
            data={entries}
            emptyMessage="No ledger entries found."
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
    </div>
  )
}
