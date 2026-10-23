import { Loader2 } from 'lucide-react'

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = ''
}) {
  const baseStyles = 'inline-flex items-center justify-center h-9 px-3.5 text-[13px] font-medium rounded-md transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-surface border border-line text-ink hover:bg-canvas',
    danger: 'bg-surface border border-line text-danger-text hover:bg-danger-bg',
    ghost: 'text-muted hover:text-ink hover:bg-canvas'
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0 mr-2" />
      ) : null}
      {children}
    </button>
  )
}
