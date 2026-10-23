import { useEffect } from 'react'
import Button from './Button'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/20"
        onClick={loading ? undefined : onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-md bg-surface border border-line p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-[13px] text-muted leading-relaxed">
          {message}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
