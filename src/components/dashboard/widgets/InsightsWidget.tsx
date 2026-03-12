import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import { Lightbulb, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { Insight } from '../../../types'

interface InsightsWidgetProps {
  insights: Insight[]
}

export default memo(function InsightsWidget({ insights }: InsightsWidgetProps) {
  const { t } = useTranslation()

  return (
    <Card animate={false} className="h-full">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={14} className="text-brand" />
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('dashboard.insights')}</span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm">
            {insight.type === 'positive' ? (
              <ShieldCheck size={14} className="text-success flex-shrink-0 mt-0.5" />
            ) : insight.type === 'warning' ? (
              <ShieldAlert size={14} className="text-warning flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={14} className="text-danger flex-shrink-0 mt-0.5" />
            )}
            <span className="text-text-secondary">{insight.message}</span>
          </div>
        ))}
      </div>
    </Card>
  )
})
