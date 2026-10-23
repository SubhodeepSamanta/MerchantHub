import Button from './Button'

export default function EmptyState({
  message = 'No records found.',
  actionText,
  onAction
}) {
  return (
    <div className="border border-line rounded-md bg-surface p-8 text-center flex flex-col items-center justify-center gap-3">
      <p className="text-[13px] text-muted">{message}</p>
      {actionText && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionText}
        </Button>
      ) : null}
    </div>
  )
}
