import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import { formatCurrency } from '../../../utils/format'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface TooltipPayloadItem {
  dataKey: string
  fill?: string
  color?: string
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

const CustomTooltip = memo(function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-elevated border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <div className="text-text-secondary mb-1">{label}</div>
      {payload.map((p: TooltipPayloadItem) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-text-primary font-medium tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
})

interface TrendDataItem {
  month: string
  reste: number
  charges: number
}

interface HistoryWidgetProps {
  trendData: TrendDataItem[]
}

export default memo(function HistoryWidget({ trendData }: HistoryWidgetProps) {
  const { t } = useTranslation()

  return (
    <Card animate={false} className="h-full">
      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
        {t('dashboard.trend6Months')}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={trendData} barGap={2}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="reste" fill="#4ADE80" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="charges" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 justify-center mt-2 text-[10px] text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" /> {t('dashboard.remainingToLive')}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger/50" /> {t('dashboard.charges')}
        </div>
      </div>
    </Card>
  )
})
