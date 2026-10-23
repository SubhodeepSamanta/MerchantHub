export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  helperText,
  error,
  required = false,
  disabled = false,
  className = '',
  name,
  min,
  max,
  step,
  autoComplete
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label ? (
        <label htmlFor={id} className="text-[13px] font-medium text-ink mb-1.5">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {prefix ? (
          <span className="absolute left-3 text-muted text-[13px] font-mono pointer-events-none select-none">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          className={`h-9 w-full rounded-md border bg-surface text-[13px] text-ink outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
            prefix ? 'pl-7 pr-3' : 'px-3'
          } ${
            error ? 'border-danger-text focus:border-danger-text' : 'border-line focus:border-ink'
          }`}
        />
      </div>
      {error ? (
        <span className="text-xs text-danger-text mt-1.5">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-muted mt-1.5">{helperText}</span>
      ) : null}
    </div>
  )
}
