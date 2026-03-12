import React, { useId } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.ComponentPropsWithoutRef<'select'>, 'children'> {
  label?: string
  options: SelectOption[]
  className?: string
}

export default function Select({ label, options, className = '', ...props }: SelectProps) {
  const id = useId()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-transparent transition-all"
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
