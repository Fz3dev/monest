import React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'

const variants = {
  primary: 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/20',
  secondary: 'bg-bg-elevated hover:bg-white/10 text-text-primary border border-white/[0.08]',
  danger: 'bg-danger/15 hover:bg-danger/25 text-danger border border-danger/20',
  ghost: 'bg-transparent hover:bg-white/[0.06] text-text-secondary',
  outline: 'border border-white/[0.12] hover:border-brand/50 text-text-secondary hover:text-white',
}

const sizes = {
  sm: 'px-3 py-2 text-xs min-h-[36px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3.5 text-base min-h-[48px]',
}

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  children: React.ReactNode
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
  disabled?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}
