import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Card from '../../ui/Card'
import ProgressBar from '../../ui/ProgressBar'
import { formatCurrency } from '../../../utils/format'
import { Target, ChevronRight } from 'lucide-react'
import type { SavingsGoal } from '../../../types'

interface SavingsWidgetProps {
  savingsGoals: SavingsGoal[]
  totalSaved: number
  totalTarget: number
  savingsProgress: number
}

export default memo(function SavingsWidget({
  savingsGoals,
  totalSaved,
  totalTarget,
  savingsProgress,
}: SavingsWidgetProps) {
  const { t } = useTranslation()

  return (
    <Link to="/epargne" className="block h-full">
      <Card animate={false} className="hover:border-brand/20 transition-colors cursor-pointer h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-brand" />
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('dashboard.goals')}</span>
          </div>
          <ChevronRight size={14} className="text-text-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-text-secondary tabular-nums">{formatCurrency(totalSaved)}</span>
              <span className="text-text-muted tabular-nums">{formatCurrency(totalTarget)}</span>
            </div>
            <ProgressBar value={totalSaved} max={totalTarget} color="#6C63FF" />
          </div>
          <span className="text-lg font-bold text-brand">{savingsProgress}%</span>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {savingsGoals.slice(0, 4).map((goal) => (
            <div key={goal.id} className="flex items-center gap-1.5 bg-white/[0.04] rounded-lg px-2.5 py-1.5 flex-shrink-0">
              <span className="text-sm">{goal.icon || '\u{1F4B0}'}</span>
              <span className="text-[11px] text-text-secondary">{goal.name}</span>
              <span className="text-[10px] text-text-muted">
                {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  )
})
