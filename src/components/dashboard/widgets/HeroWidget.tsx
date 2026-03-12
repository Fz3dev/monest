import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import AnimatedNumber from '../../ui/AnimatedNumber'
import { formatCurrency } from '../../../utils/format'
import {
  Wallet, TrendingDown, ShoppingBag,
} from 'lucide-react'

interface HeroWidgetProps {
  configModel: string | undefined
  flexNumber: number
  daysLeft: number
  totalIncome: number
  totalCharges: number
  monthExpenses: number
  hasIncome: boolean
  chargesRate: number
  getFlexColor: (val: number) => string
}

export default memo(function HeroWidget({
  configModel,
  flexNumber,
  daysLeft,
  totalIncome,
  totalCharges,
  monthExpenses,
  hasIncome,
  chargesRate,
  getFlexColor,
}: HeroWidgetProps) {
  const { t } = useTranslation()

  return (
    <Card animate={false} className="glass !border-brand/20 h-full">
      <div className="text-center py-3 lg:py-5">
        <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1 lg:text-xs">
          {configModel === 'solo' ? t('dashboard.remainingSolo') : t('dashboard.remainingCouple')}
        </div>
        <div className={`text-5xl font-black tracking-tight lg:text-6xl ${getFlexColor(flexNumber)}`}>
          <AnimatedNumber value={flexNumber} format={(v) => formatCurrency(Math.round(v))} />
        </div>
        <div className="text-[11px] text-text-muted mt-2 lg:text-sm">{t('dashboard.toSpendThisMonth')}</div>
        {flexNumber > 0 && (
          <div className="text-sm text-text-secondary mt-1 lg:text-base">
            <span className="font-semibold tabular-nums">{formatCurrency(Math.round(flexNumber / Math.max(daysLeft, 1)))}</span>
            <span className="text-text-muted"> / {t('dashboard.day')}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 mt-4 lg:gap-10 lg:mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <Wallet size={11} className="text-brand" />
              <span>{t('dashboard.income')}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums lg:text-base">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <TrendingDown size={11} className="text-danger" />
              <span>{t('dashboard.charges')}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums lg:text-base">{formatCurrency(totalCharges)}</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-xs text-text-muted mb-0.5">
              <ShoppingBag size={11} className="text-warning" />
              <span>{t('dashboard.expense')}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums lg:text-base">{formatCurrency(monthExpenses)}</span>
          </div>
        </div>

        {hasIncome && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] lg:mt-6 lg:pt-4">
            <div className="flex items-center justify-center gap-2">
              <Wallet size={14} className={chargesRate <= 40 ? 'text-success' : chargesRate <= 60 ? 'text-warning' : 'text-danger'} />
              <span className={`text-sm font-semibold ${chargesRate <= 40 ? 'text-success' : chargesRate <= 60 ? 'text-warning' : 'text-danger'}`}>
                {t('dashboard.chargesRate', { rate: chargesRate })}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
})
