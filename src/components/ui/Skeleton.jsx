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

export function ExpensesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-center gap-3">
        <SkeletonPulse className="w-8 h-8 rounded-xl" />
        <SkeletonPulse className="h-7 w-28" />
        <SkeletonPulse className="w-8 h-8 rounded-xl" />
      </div>
      {/* Total card */}
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-5 text-center">
        <SkeletonPulse className="h-8 w-32 mx-auto mb-2" />
        <SkeletonPulse className="h-3 w-24 mx-auto" />
      </div>
      {/* Category pills */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonPulse key={i} className="h-7 w-16 rounded-full" />
        ))}
      </div>
      {/* Expense items */}
      <div className="space-y-1.5">
        <SkeletonPulse className="h-3 w-24 mb-2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <SkeletonPulse className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <SkeletonPulse className="h-3.5 w-28" />
                <SkeletonPulse className="h-2.5 w-16" />
              </div>
              <SkeletonPulse className="h-3.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChargesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-8 w-28" />
        <SkeletonPulse className="h-9 w-24 rounded-xl" />
      </div>
      {/* Total card */}
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
        <div className="flex justify-between items-center">
          <SkeletonPulse className="h-3 w-28" />
          <SkeletonPulse className="h-5 w-20" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 bg-bg-surface/60 rounded-xl p-1">
        {[1, 2, 3].map((i) => (
          <SkeletonPulse key={i} className="flex-1 h-8 rounded-lg" />
        ))}
      </div>
      {/* Charge items */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-3.5 w-32" />
              <SkeletonPulse className="h-2.5 w-48" />
            </div>
            <SkeletonPulse className="w-12 h-6 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MonthlySkeleton() {
  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-center gap-3">
        <SkeletonPulse className="w-8 h-8 rounded-xl" />
        <SkeletonPulse className="h-7 w-28" />
        <SkeletonPulse className="w-8 h-8 rounded-xl" />
      </div>
      {/* Income + Balance cards */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
        {[1, 2].map((i) => (
          <div key={i} className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <SkeletonPulse className="h-3 w-20" />
            <SkeletonPulse className="h-10 w-full rounded-xl" />
            <SkeletonPulse className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      {/* Charges card */}
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4 space-y-2">
        <SkeletonPulse className="h-3 w-32" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-2">
            <SkeletonPulse className="h-3.5 w-28" />
            <SkeletonPulse className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      {/* Remaining */}
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4 space-y-3">
        <SkeletonPulse className="h-3 w-24" />
        <div className="flex justify-between">
          <SkeletonPulse className="h-3.5 w-20" />
          <SkeletonPulse className="h-6 w-24" />
        </div>
      </div>
    </div>
  )
}

export function SavingsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-8 w-24" />
        <SkeletonPulse className="h-9 w-24 rounded-xl" />
      </div>
      {/* Overview card */}
      <div className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-5">
          <SkeletonPulse className="w-[130px] h-[130px] rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <SkeletonPulse className="h-2.5 w-16" />
              <SkeletonPulse className="h-6 w-24" />
            </div>
            <SkeletonPulse className="h-px w-full" />
            <div className="space-y-1.5">
              <SkeletonPulse className="h-2.5 w-16" />
              <SkeletonPulse className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
      {/* Goal cards */}
      {[1, 2].map((i) => (
        <div key={i} className="bg-bg-surface/60 border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <SkeletonPulse className="w-11 h-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-3.5 w-32" />
              <SkeletonPulse className="h-2 w-full rounded-full" />
              <SkeletonPulse className="h-2.5 w-40" />
              <SkeletonPulse className="h-8 w-full rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SkeletonPulse
