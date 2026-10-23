export default function PageHeader({
  title,
  description,
  action
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[20px] font-semibold text-ink leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted mt-1">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex items-center gap-3 shrink-0">
          {action}
        </div>
      ) : null}
    </div>
  )
}
