export default function StatStrip({ items = [] }) {
  if (!items.length) return null

  return (
    <div className="border border-line rounded-md bg-surface grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
            {item.label}
          </span>
          <div className="mt-2">
            <span className="font-mono text-[22px] font-medium text-ink tabular-nums leading-tight block">
              {item.value}
            </span>
            {item.subline ? (
              <span className="text-xs text-muted mt-1 block">
                {item.subline}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
