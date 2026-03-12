import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import AnimatedNumber from '../../ui/AnimatedNumber'
import { formatCurrency } from '../../../utils/format'
import { ArrowUpRight, TrendingUp, ArrowDownRight } from 'lucide-react'

interface PersonsWidgetProps {
  personAName: string
  personAColor: string
  personBName: string | undefined
  personBColor: string | undefined
  resteA: number
  resteB: number
  incomeA: number
  incomeB: number
  startingBalanceA: number
  startingBalanceB: number
  shareA: number
  shareB: number
  personalACharges: number
  personalBCharges: number
  ratio: number
  hasIncome: boolean
}

function getHealthIcon(val: number): ReactNode {
  if (val >= 1000) return <ArrowUpRight size={14} className="text-success" />
  if (val >= 0) return <TrendingUp size={14} className="text-warning" />
  return <ArrowDownRight size={14} className="text-danger" />
}

export default memo(function PersonsWidget({
  personAName,
  personAColor,
  personBName,
  personBColor,
  resteA,
  resteB,
  incomeA,
  incomeB,
  startingBalanceA,
  startingBalanceB,
  shareA,
  shareB,
  personalACharges,
  personalBCharges,
  ratio,
  hasIncome,
}: PersonsWidgetProps) {
  const { t } = useTranslation()

  return (
    <div className={`grid gap-3 h-full ${personBName ? 'grid-cols-2' : 'grid-cols-1'}`}>
      <Card animate={false} className="h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-text-secondary font-medium">{personAName || t('common.personA')}</div>
          <div className="flex items-center gap-1">{getHealthIcon(resteA)}</div>
        </div>
        <div className="text-2xl font-bold lg:text-3xl" style={{ color: personAColor }}>
          <AnimatedNumber value={resteA} format={(v) => formatCurrency(Math.round(v))} />
        </div>
        <div className="text-[10px] text-text-muted mb-2">{t('dashboard.remainingToSpend')}</div>
        {hasIncome && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted">{t('dashboard.personalIncome')}</span>
              <span className="text-text-secondary tabular-nums">{formatCurrency(incomeA)}</span>
            </div>
            {startingBalanceA !== 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.startingBalance')}</span>
                <span className={`tabular-nums ${startingBalanceA < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                  {formatCurrency(startingBalanceA)}
                </span>
              </div>
            )}
            {shareA > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.commonShare', { percent: Math.round(ratio * 100) })}</span>
                <span className="text-danger tabular-nums">- {formatCurrency(shareA)}</span>
              </div>
            )}
            {personalACharges > 0 && (
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.personalCharges')}</span>
                <span className="text-danger tabular-nums">- {formatCurrency(personalACharges)}</span>
              </div>
            )}
          </div>
        )}
      </Card>
      {personBName && (
        <Card animate={false} className="h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-text-secondary font-medium">{personBName}</div>
            <div className="flex items-center gap-1">{getHealthIcon(resteB)}</div>
          </div>
          <div className="text-2xl font-bold lg:text-3xl" style={{ color: personBColor }}>
            <AnimatedNumber value={resteB} format={(v) => formatCurrency(Math.round(v))} />
          </div>
          <div className="text-[10px] text-text-muted mb-2">{t('dashboard.remainingToSpend')}</div>
          {hasIncome && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex justify-between text-[11px]">
                <span className="text-text-muted">{t('dashboard.personalIncome')}</span>
                <span className="text-text-secondary tabular-nums">{formatCurrency(incomeB)}</span>
              </div>
              {startingBalanceB !== 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.startingBalance')}</span>
                  <span className={`tabular-nums ${startingBalanceB < 0 ? 'text-danger' : 'text-text-secondary'}`}>
                    {formatCurrency(startingBalanceB)}
                  </span>
                </div>
              )}
              {shareB > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.commonShare', { percent: Math.round((1 - ratio) * 100) })}</span>
                  <span className="text-danger tabular-nums">- {formatCurrency(shareB)}</span>
                </div>
              )}
              {personalBCharges > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-muted">{t('dashboard.personalCharges')}</span>
                  <span className="text-danger tabular-nums">- {formatCurrency(personalBCharges)}</span>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
})
