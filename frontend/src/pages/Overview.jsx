import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { getDashboardSummary, getPayments } from '../api/endpoints'
import { formatINR, formatDateTime } from '../utils/format'
import PageHeader from '../components/ui/PageHeader'
import StatStrip from '../components/ui/StatStrip'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

function formatChartDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const day = parseInt(parts[2], 10)
  const monthIdx = parseInt(parts[1], 10) - 1
  return `${day} ${MONTH_NAMES[monthIdx] || ''}`
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface border border-line rounded px-2.5 py-1.5 shadow-sm text-xs">
        <p className="text-muted mb-0.5">{data.formattedDate}</p>
        <p className="font-mono text-ink font-medium tabular-nums">
          {formatINR(data.amount)}
        </p>
      </div>
    )
  }
  return null
}

export default function Overview() {
  const [summary, setSummary] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const lastUpdatedRef = useRef(0)

  useEffect(() => {
    let ignore = false
    lastUpdatedRef.current = Date.now()

    const loadData = async (isInitial) => {
      try {
        const [sumData, paymentsData] = await Promise.all([
          getDashboardSummary(),
          getPayments(0, 5)
        ])
        if (!ignore) {
          setSummary(sumData)
          setRecentPayments(paymentsData?.content || [])
          setError(null)
          lastUpdatedRef.current = Date.now()
          setSecondsAgo(0)
        }
      } catch {
        if (!ignore && isInitial) {
          setError('Failed to load overview data.')
        }
      } finally {
        if (!ignore && isInitial) {
          setInitialLoading(false)
        }
      }
    }

    loadData(true)

    const pollInterval = setInterval(() => {
      loadData(false)
    }, 5000)

    const timerInterval = setInterval(() => {
      if (lastUpdatedRef.current > 0) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdatedRef.current) / 1000))
      }
    }, 1000)

    return () => {
      ignore = true
      clearInterval(pollInterval)
      clearInterval(timerInterval)
    }
  }, [reloadKey])

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }, [])

  const chartData = useMemo(() => {
    if (!summary?.dailyVolume) return []
    return summary.dailyVolume.map((item) => ({
      ...item,
      formattedDate: formatChartDate(item.date)
    }))
  }, [summary])

  const sevenDayTotal = useMemo(() => {
    if (!summary?.dailyVolume) return 0
    return summary.dailyVolume.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  }, [summary])

  const statItems = useMemo(() => {
    if (!summary) return []
    return [
      {
        label: 'Wallet balance',
        value: formatINR(summary.walletBalance || 0)
      },
      {
        label: "Today's volume",
        value: formatINR(summary.todayVolume || 0)
      },
      {
        label: 'Success rate',
        value: `${Number(summary.successRate || 0).toFixed(1)}%`
      },
      {
        label: 'Outstanding advance',
        value: formatINR(summary.outstandingAdvance || 0)
      }
    ]
  }, [summary])

  const paymentColumns = [
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

  const liveIndicator = (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      <span className="text-xs text-muted">
        {secondsAgo <= 1 ? 'Updated just now' : `Updated ${secondsAgo}s ago`}
      </span>
    </div>
  )

  if (initialLoading) {
    return (
      <div>
        <PageHeader title="Overview" description={todayFormatted} action={liveIndicator} />
        <div className="border border-line rounded-md bg-surface p-6 h-28 animate-pulse bg-neutral-bg mb-6" />
        <div className="border border-line rounded-md bg-surface p-6 h-64 animate-pulse bg-neutral-bg mb-6" />
        <div className="border border-line rounded-md bg-surface p-6 h-48 animate-pulse bg-neutral-bg" />
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div>
        <PageHeader title="Overview" description={todayFormatted} />
        <div className="border border-line rounded-md bg-surface p-8 text-center flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setInitialLoading(true)
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Overview"
        description={todayFormatted}
        action={liveIndicator}
      />

      <StatStrip items={statItems} />

      <div className="border border-line rounded-md bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Last 7 days</h2>
            <p className="text-xs text-muted mt-0.5">Daily collection volume</p>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted block">
              7-day total
            </span>
            <span className="font-mono text-base font-medium text-ink tabular-nums">
              {formatINR(sevenDayTotal)}
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--color-line)"
                vertical={false}
              />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--color-neutral-bg)', opacity: 0.5 }}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-accent)"
                fillOpacity={0.85}
                barSize={28}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">Recent payments</h2>
          <Link
            to="/payments"
            className="text-xs font-medium text-muted hover:text-ink transition-colors duration-150"
          >
            View all
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <EmptyState message="No payments received yet." />
        ) : (
          <DataTable
            columns={paymentColumns}
            data={recentPayments}
            emptyMessage="No recent payments found."
          />
        )}
      </div>
    </div>
  )
}
