import { motion } from 'motion/react'

export default function ProgressBar({ value, max, color = '#6C63FF', className = '' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className={`h-1.5 bg-white/[0.06] rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
