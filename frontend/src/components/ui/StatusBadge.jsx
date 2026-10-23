const statusConfig = {
  SUCCESS: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    label: 'Success'
  },
  FAILED: {
    bg: 'bg-danger-bg',
    text: 'text-danger-text',
    label: 'Failed'
  },
  PENDING: {
    bg: 'bg-warning-bg',
    text: 'text-warning-text',
    label: 'Pending'
  },
  REFUNDED: {
    bg: 'bg-neutral-bg',
    text: 'text-neutral-text',
    label: 'Refunded'
  },
  ACTIVE: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    label: 'Active'
  },
  REPAID: {
    bg: 'bg-neutral-bg',
    text: 'text-neutral-text',
    label: 'Repaid'
  }
}

export default function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()
  const config = statusConfig[normalized] || {
    bg: 'bg-neutral-bg',
    text: 'text-neutral-text',
    label: status || 'Unknown'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      <span>{config.label}</span>
    </span>
  )
}
