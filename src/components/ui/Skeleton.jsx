import { motion } from 'motion/react'

function SkeletonPulse({ className = '' }) {
  return (
    <motion.div
      className={`bg-white/[0.06] rounded-lg ${className}`}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonPulse className="h-8 w-40" />
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-6">
        <SkeletonPulse className="h-3 w-32 mx-auto mb-3" />
        <SkeletonPulse className="h-10 w-40 mx-auto mb-2" />
        <SkeletonPulse className="h-3 w-28 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
          <SkeletonPulse className="h-3 w-16 mb-2" />
          <SkeletonPulse className="h-7 w-24 mb-1" />
          <SkeletonPulse className="h-2 w-12" />
        </div>
        <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
          <SkeletonPulse className="h-3 w-16 mb-2" />
          <SkeletonPulse className="h-7 w-24 mb-1" />
          <SkeletonPulse className="h-2 w-12" />
        </div>
      </div>
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
        <SkeletonPulse className="h-3 w-24 mb-3" />
        <SkeletonPulse className="h-24 w-full" />
      </div>
    </div>
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4 space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse key={i} className={`h-3 ${i === 0 ? 'w-24' : 'w-full'}`} />
      ))}
    </div>
  )
}

export default SkeletonPulse
