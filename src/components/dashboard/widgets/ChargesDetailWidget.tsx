import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import Card from '../../ui/Card'
import { formatCurrency } from '../../../utils/format'
import { ArrowUpRight } from 'lucide-react'
import { PAYER, PAYER_ORDER } from '../../../types'
import type { Payer, ChargeDetail } from '../../../types'

interface ChargesDetailWidgetProps {
  charges: ChargeDetail[]
  flexNumber: number
  personAName: string
  personAColor: string
  personBName: string | undefined
  personBColor: string | undefined
  getCategoryColor: (name: string) => string
}

export default memo(function ChargesDetailWidget({
  charges,
  flexNumber,
  personAName,
  personAColor,
  personBName,
  personBColor,
  getCategoryColor,
}: ChargesDetailWidgetProps) {
  const { t } = useTranslation()
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null)
  const [chargePayerFilter, setChargePayerFilter] = useState<Payer | null>(null)

  const filtered = useMemo(
    () => chargePayerFilter ? charges.filter((c) => c.payer === chargePayerFilter) : charges,
    [charges, chargePayerFilter]
  )

  const groups = useMemo(() => {
    const g: Record<string, typeof filtered> = {}
    for (const charge of filtered) {
      const cat = charge.category || 'autre'
      if (!g[cat]) g[cat] = []
      g[cat].push(charge)
    }
    // Sort charges within each category: common → person_a → person_b
    for (const cat of Object.keys(g)) {
      g[cat].sort((a, b) => (PAYER_ORDER[a.payer] ?? 9) - (PAYER_ORDER[b.payer] ?? 9) || b.amount - a.amount)
    }
    return Object.entries(g)
      .sort(([, a], [, b]) => {
        const totalA = a.reduce((s: number, c) => s + c.amount, 0)
        const totalB = b.reduce((s: number, c) => s + c.amount, 0)
        return totalB - totalA
      })
  }, [filtered])

  return (
    <Card animate={false}>
      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
        {t('dashboard.chargesDetail')}
      </div>
      {personBName && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {([
            { value: null, label: t('common.all') },
            { value: PAYER.Common, label: t('common.common') },
            { value: PAYER.PersonA, label: personAName },
            { value: PAYER.PersonB, label: personBName },
          ] satisfies { value: Payer | null; label: string }[]).map((opt) => (
            <button
              key={opt.value ?? 'all'}
              onClick={() => setChargePayerFilter(chargePayerFilter === opt.value ? null : opt.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                chargePayerFilter === opt.value
                  ? 'bg-brand/15 text-brand border border-brand/30'
                  : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
              }`}
              style={chargePayerFilter === opt.value && opt.value === 'person_a' ? { backgroundColor: `${personAColor}15`, color: personAColor, borderColor: `${personAColor}40` } :
                     chargePayerFilter === opt.value && opt.value === 'person_b' ? { backgroundColor: `${personBColor}15`, color: personBColor, borderColor: `${personBColor}40` } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">{t('charges.noResults')}</p>
        ) : (
          groups.map(([cat, catCharges]) => {
            const catTotal = catCharges.reduce((s, c) => s + c.amount, 0)
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                    <span className="text-[11px] font-semibold text-text-muted">{t(`categories.${cat}`)}</span>
                  </div>
                  <span className="text-[11px] text-text-muted tabular-nums">{formatCurrency(catTotal)}</span>
                </div>
                {catCharges.map((charge) => (
                  <div
                    key={charge.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer rounded-lg px-1.5 py-1.5 -mx-1.5 transition-colors hover:bg-white/[0.04]"
                    onClick={() => setSelectedChargeId(selectedChargeId === charge.id ? null : charge.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedChargeId(selectedChargeId === charge.id ? null : charge.id) }}
                  >
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 min-w-0 pl-3.5">
                        <span className="text-text-secondary truncate">{charge.name}</span>
                        {personBName && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={charge.payer === 'common'
                              ? { backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }
                              : { backgroundColor: `${charge.payer === 'person_a' ? personAColor : personBColor}15`, color: charge.payer === 'person_a' ? personAColor : personBColor }
                            }
                          >
                            {charge.payer === 'common' ? t('common.common') : charge.payer === 'person_a' ? personAName : personBName}
                          </span>
                        )}
                        {charge.type === 'installment' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand flex-shrink-0">{t('dashboard.installmentBadge')}</span>
                        )}
                        {charge.type === 'planned' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning flex-shrink-0">{t('dashboard.plannedBadge')}</span>
                        )}
                      </div>
                      <span className="font-medium tabular-nums ml-2">{formatCurrency(charge.amount)}</span>
                    </div>
                    {selectedChargeId === charge.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-1 mt-1 ml-4"
                      >
                        <ArrowUpRight size={12} className="text-brand" />
                        <span className="text-xs text-brand">
                          {t('dashboard.whatIf', { amount: formatCurrency(flexNumber + charge.amount) })}
                        </span>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
})
