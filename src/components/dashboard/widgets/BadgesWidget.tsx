import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import type { Badge } from '../../../types'

interface BadgesWidgetProps {
  streak: number
  badges: Badge[]
}

export default memo(function BadgesWidget({ streak, badges }: BadgesWidgetProps) {
  const { t } = useTranslation()

  return (
    <Card animate={false} className="h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{streak > 0 ? '\u{1F525}' : '\u{1F31F}'}</span>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
          {t('dashboard.badges')}
        </span>
      </div>
      {streak > 0 ? (
        <div className="text-center mb-3">
          <span className="text-2xl font-black text-brand">
            {streak === 1 ? t('dashboard.streakSingle') : t('dashboard.streak', { count: streak })}
          </span>
        </div>
      ) : (
        <div className="text-center mb-3">
          <span className="text-sm text-text-muted">{t('dashboard.noStreak')}</span>
        </div>
      )}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.slice(0, 4).map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1.5 bg-white/[0.06] rounded-full px-3 py-1"
            >
              <span className="text-sm">{badge.icon}</span>
              <span className="text-[11px] text-text-secondary">{badge.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
})
