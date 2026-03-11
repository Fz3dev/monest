import { useId } from 'react'

export default function Input({ label, suffix, error, className = '', value, ...props }) {
  const id = useId()
  // Always pass a string to the native input to prevent cursor jumping
  const stringValue = value == null ? '' : String(value)

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          value={stringValue}
          style={{ colorScheme: 'dark' }}
          className={`w-full bg-white/[0.04] border rounded-xl px-3 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all ${
            error ? 'border-danger/50' : 'border-white/[0.08]'
          }`}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
