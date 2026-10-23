import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function SidePanel({
  isOpen,
  onClose,
  title,
  children
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="fixed inset-0 bg-black/20 transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-[440px] h-full bg-surface border-l border-line shadow-lg flex flex-col transition-transform duration-150 ease-out">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors duration-150 p-1 rounded-md"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
