import { motion } from 'motion/react'

export default function Card({ children, className = '', animate = true, ...props }) {
  const base = 'bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4'

  if (!animate) {
    return <div className={`${base} ${className}`} {...props}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`${base} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}
