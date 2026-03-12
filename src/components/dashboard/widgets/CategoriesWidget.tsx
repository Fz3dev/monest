import { memo, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../../ui/Card'
import ProgressBar from '../../ui/ProgressBar'
import { formatCurrency, getCategoryLabel } from '../../../utils/format'
import { PAYER } from '../../../types'
import type { Payer, ChargeDetail } from '../../../types'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface CategoriesWidgetProps {
  charges: ChargeDetail[]
  personAName: string
  personAColor: string
  personBName: string | undefined
  personBColor: string | undefined
  getCategoryColor: (name: string) => string
}

export default memo(function CategoriesWidget({
  charges,
  personAName,
  personAColor,
  personBName,
  personBColor,
  getCategoryColor,
}: CategoriesWidgetProps) {
  const { t } = useTranslation()
  const [catPayerFilter, setCatPayerFilter] = useState<Payer | null>(null)

  const filteredCatCharges = useMemo(
    () => catPayerFilter ? charges.filter((c) => c.payer === catPayerFilter) : charges,
    [charges, catPayerFilter]
  )

  const filteredCatData = useMemo(() => {
    const cats: Record<string, number> = {}
    filteredCatCharges.forEach((c) => {
      const key = c.category || 'autre'
      cats[key] = (cats[key] || 0) + c.amount
    })
    return Object.entries(cats)
      .map(([name, value]) => ({
        name,
        label: getCategoryLabel(name),
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredCatCharges, getCategoryColor])

  const filteredCatTotal = useMemo(
    () => filteredCatCharges.reduce((s, c) => s + c.amount, 0),
    [filteredCatCharges]
  )

  return (
    <Card animate={false}>
      <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
        {t('dashboard.categoryBreakdown')}
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
              onClick={() => setCatPayerFilter(catPayerFilter === opt.value ? null : opt.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                catPayerFilter === opt.value
                  ? 'bg-brand/15 text-brand border border-brand/30'
                  : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
              }`}
              style={catPayerFilter === opt.value && opt.value === 'person_a' ? { backgroundColor: `${personAColor}15`, color: personAColor, borderColor: `${personAColor}40` } :
                     catPayerFilter === opt.value && opt.value === 'person_b' ? { backgroundColor: `${personBColor}15`, color: personBColor, borderColor: `${personBColor}40` } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {filteredCatData.length > 1 && (
        <div className="flex justify-center mb-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={filteredCatData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                {filteredCatData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      {filteredCatData.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">{t('charges.noResults')}</p>
      ) : (
        <div className="space-y-3">
          {filteredCatData.map((cat) => (
            <div key={cat.name}>
              <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-text-secondary">{cat.label}</span>
                </div>
                <span className="font-medium tabular-nums">{formatCurrency(cat.value)}</span>
              </div>
              <ProgressBar value={cat.value} max={filteredCatTotal} color={cat.color} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
})
