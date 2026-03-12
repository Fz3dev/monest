import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { computeMonth } from '../utils/calculations'
import { formatCurrency, formatMonth, getCurrentMonth } from '../utils/format'
import { useCategoriesStore } from '../stores/categoriesStore'
import { PAYER } from '../types'
import type { Payer, ChargeDetail } from '../types'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import ProgressBar from '../components/ui/ProgressBar'
import { ChevronLeft, ChevronRight, Wallet, TrendingDown, AlertTriangle, CheckCircle2, ArrowUpDown, ToggleLeft, ToggleRight, Send, Pencil } from 'lucide-react'
import { addMonths, subMonths, format } from 'date-fns'
import { createNotification } from '../lib/notifications'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { toast } from 'sonner'

export default function MonthlyPage() {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const getCategoryColor = useCategoriesStore((s) => s.getCategoryColor)
  const entries = useMonthlyStore((s) => s.entries)
  const setEntry = useMonthlyStore((s) => s.setEntry)
  const updateVariable = useMonthlyStore((s) => s.updateVariable)
  const toggleChargeForMonth = useMonthlyStore((s) => s.toggleChargeForMonth)

  const [currentMonth, setCurrentMonth] = useState(() => getCurrentMonth())
  const [chargePayerFilter, setChargePayerFilter] = useState<Payer | null>(null)
  const [editingCharge, setEditingCharge] = useState<{ id: string; name: string; amount: number } | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const touchStartX = useRef<number | null>(null)

  const entry = entries[currentMonth] || null
  const result = useMemo(
    () => computeMonth(currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry),
    [currentMonth, household, fixedCharges, installmentPayments, plannedExpenses, entry]
  )

  const navigateMonth = (direction: 'next' | 'prev') => {
    const date = new Date(currentMonth + '-01')
    const newDate = direction === 'next' ? addMonths(date, 1) : subMonths(date, 1)
    setCurrentMonth(format(newDate, 'yyyy-MM'))
  }

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(diff) > 60) navigateMonth(diff > 0 ? 'next' : 'prev')
  }

  const handleIncomeChange = (field: string, value: string) => {
    const num = parseFloat(value) || 0
    setEntry(currentMonth, { ...(entry || {}), [field]: num })
  }

  const getResteColor = (reste: number): string => {
    if (reste >= 1500) return 'text-success'
    if (reste >= 500) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Month navigation — swipe left/right to change month */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          aria-label={t('expenses.prevMonth')}
        >
          <ChevronLeft size={20} />
        </button>
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentMonth}
            className="text-xl font-bold min-w-[120px] text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {formatMonth(currentMonth)}
          </motion.h1>
        </AnimatePresence>
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 text-text-muted hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors"
          aria-label={t('expenses.nextMonth')}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Revenus + Solde — side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
        <Card>
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.income')}</h2>
          <div className="space-y-3">
            <Input
              label={t('monthly.salary', { name: household?.personAName || t('common.personA') })}
              type="number"
              value={entry?.incomeA || ''}
              onChange={(e) => handleIncomeChange('incomeA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            {household?.personBName && (
              <Input
                label={t('monthly.salary', { name: household.personBName })}
                type="number"
                value={entry?.incomeB || ''}
                onChange={(e) => handleIncomeChange('incomeB', e.target.value)}
                placeholder="0"
                suffix="€"
              />
            )}
            {/* Other income */}
            <div className="border-t border-white/[0.06] pt-3 mt-1">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{t('monthly.otherIncome')}</h3>
              <div className="space-y-3">
                <Input
                  label={t('monthly.otherIncomeCommon')}
                  type="number"
                  value={entry?.otherIncomeCommon || ''}
                  onChange={(e) => handleIncomeChange('otherIncomeCommon', e.target.value)}
                  placeholder="0"
                  suffix="€"
                />
                <Input
                  label={t('monthly.otherIncomePersonal', { name: household?.personAName || t('common.personA') })}
                  type="number"
                  value={entry?.otherIncomeA || ''}
                  onChange={(e) => handleIncomeChange('otherIncomeA', e.target.value)}
                  placeholder="0"
                  suffix="€"
                />
                {household?.personBName && (
                  <Input
                    label={t('monthly.otherIncomePersonal', { name: household.personBName })}
                    type="number"
                    value={entry?.otherIncomeB || ''}
                    onChange={(e) => handleIncomeChange('otherIncomeB', e.target.value)}
                    placeholder="0"
                    suffix="€"
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={12} className="text-warning" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('monthly.balanceBefore')}</h2>
            <div className="relative group ml-auto">
              <span className="text-text-muted text-[10px] cursor-help border border-white/10 rounded-full w-4 h-4 flex items-center justify-center hover:text-text-secondary transition-colors">?</span>
              <div className="absolute right-0 top-6 w-56 p-2.5 rounded-xl bg-bg-elevated border border-white/10 text-[11px] text-text-muted shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-20">
                {t('monthly.balanceBeforeHint')}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-text-muted mb-3 lg:hidden">
            {t('monthly.balanceBeforeHintMobile')}
          </p>
          <div className="space-y-3">
            <Input
              label={t('monthly.balance', { name: household?.personAName || t('common.personA') })}
              type="number"
              value={entry?.startingBalanceA ?? ''}
              onChange={(e) => handleIncomeChange('startingBalanceA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            {household?.personBName && (
              <Input
                label={t('monthly.balance', { name: household.personBName })}
                type="number"
                value={entry?.startingBalanceB ?? ''}
                onChange={(e) => handleIncomeChange('startingBalanceB', e.target.value)}
                placeholder="0"
                suffix="€"
              />
            )}
          </div>
        </Card>
      </div>

      {/* Charges grouped by category */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('monthly.monthCharges')}</h2>
        </div>
        {household?.personBName && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {([
              { value: null, label: t('common.all') },
              { value: PAYER.Common, label: t('common.common') },
              { value: PAYER.PersonA, label: household.personAName },
              { value: PAYER.PersonB, label: household.personBName },
            ] satisfies { value: Payer | null; label: string }[]).map((opt) => (
              <button
                key={opt.value ?? 'all'}
                onClick={() => setChargePayerFilter(chargePayerFilter === opt.value ? null : opt.value)}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-colors ${
                  chargePayerFilter === opt.value
                    ? 'bg-brand/15 text-brand border border-brand/30'
                    : 'bg-white/[0.04] text-text-muted border border-white/[0.08]'
                }`}
                style={chargePayerFilter === opt.value && opt.value === 'person_a' ? { backgroundColor: `${household.personAColor}15`, color: household.personAColor, borderColor: `${household.personAColor}40` } :
                       chargePayerFilter === opt.value && opt.value === 'person_b' ? { backgroundColor: `${household.personBColor}15`, color: household.personBColor, borderColor: `${household.personBColor}40` } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {result.charges.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">
            {t('monthly.noCharges')}
          </p>
        ) : (
          <div className="space-y-4">
            {(() => {
              // Filter charges by payer
              const filtered = chargePayerFilter
                ? result.charges.filter((c) => c.payer === chargePayerFilter)
                : result.charges
              // Group charges by category
              const groups: Record<string, ChargeDetail[]> = {}
              for (const charge of filtered) {
                const cat = charge.category || 'autre'
                if (!groups[cat]) groups[cat] = []
                groups[cat].push(charge)
              }
              if (filtered.length === 0) return (
                <p className="text-sm text-text-muted text-center py-4">{t('charges.noResults')}</p>
              )
              // Sort groups by total amount (descending)
              const sorted = Object.entries(groups).sort(([, a], [, b]) => {
                const totalA = a.reduce((s: number, c) => s + (c.isDisabledThisMonth ? 0 : c.amount), 0)
                const totalB = b.reduce((s: number, c) => s + (c.isDisabledThisMonth ? 0 : c.amount), 0)
                return totalB - totalA
              })
              return sorted.map(([cat, charges]) => {
                const catTotal = charges.reduce((s, c) => s + (c.isDisabledThisMonth ? 0 : c.amount), 0)
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(cat) }} />
                        <span className="text-[11px] font-semibold text-text-muted">{t(`categories.${cat}`)}</span>
                      </div>
                      <span className="text-[11px] text-text-muted tabular-nums">{formatCurrency(catTotal)}</span>
                    </div>
                    <div>
                      {charges.map((charge) => (
                        <div key={charge.id} className={`flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 ${charge.isDisabledThisMonth ? 'opacity-40' : ''}`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0 pl-3.5">
                            <span className="text-sm text-text-secondary truncate">{charge.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {charge.isDisabledThisMonth ? (
                              <span className="text-xs text-text-muted italic">{t('monthly.disabled')}</span>
                            ) : (
                              <button
                                onClick={() => {
                                  if (charge.type === 'fixed') {
                                    const currentVal = entry?.variableOverrides?.[charge.id] !== undefined
                                      ? entry.variableOverrides[charge.id]
                                      : (charge.originalAmount ?? charge.amount)
                                    setEditingCharge({ id: charge.id, name: charge.name, amount: currentVal })
                                    setEditAmount(String(currentVal))
                                  }
                                }}
                                className={`flex items-center gap-1.5 ${charge.type === 'fixed' ? 'cursor-pointer hover:text-brand transition-colors' : ''}`}
                                disabled={charge.type !== 'fixed'}
                              >
                                <span className="text-sm font-medium tabular-nums">{formatCurrency(charge.amount)}</span>
                                {charge.type === 'fixed' && <Pencil size={12} className="text-text-muted" />}
                              </button>
                            )}
                            {charge.type === 'fixed' && (
                              <button
                                onClick={() => toggleChargeForMonth(currentMonth, charge.id)}
                                className="p-0.5 text-text-muted flex-shrink-0"
                                aria-label={charge.isDisabledThisMonth ? t('monthly.enableCharge') : t('monthly.disableCharge')}
                              >
                                {charge.isDisabledThisMonth
                                  ? <ToggleLeft size={18} />
                                  : <ToggleRight size={18} className="text-success" />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </Card>

      {/* Reste a vivre + Repartition — side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
      <Card className="glass !border-brand/20">
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.remainingToLive')}</h2>
        <div className="space-y-3">
          {/* Income vs charges bar */}
          {(result.incomeA > 0 || result.incomeB > 0) && (
            <div className="space-y-1.5 mb-2">
              <div className="flex justify-between text-[10px] text-text-muted">
                <div className="flex items-center gap-1"><Wallet size={10} /> {t('monthly.incomeLabel')}</div>
                <div className="flex items-center gap-1"><TrendingDown size={10} /> {t('monthly.chargesLabel')}</div>
              </div>
              <ProgressBar
                value={result.totalCommon + result.personalACharges + result.personalBCharges}
                max={result.incomeA + result.incomeB}
                color={result.resteFoyer >= 1000 ? '#4ADE80' : result.resteFoyer >= 0 ? '#FBBF24' : '#F87171'}
              />
              <div className="flex justify-between text-[10px] text-text-muted tabular-nums">
                <span>{formatCurrency(result.incomeA + result.incomeB)}</span>
                <span>{formatCurrency(result.totalCommon + result.personalACharges + result.personalBCharges)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm" style={{ color: household?.personAColor }}>{household?.personAName}</span>
              {result.startingBalanceA < 0 && (
                <span className="text-[10px] text-danger ml-1.5">({formatCurrency(result.startingBalanceA)})</span>
              )}
            </div>
            <span className={`text-xl font-bold ${getResteColor(result.resteA)}`}>
              <AnimatedNumber value={result.resteA} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
          {household?.personBName && (
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm" style={{ color: household?.personBColor }}>{household.personBName}</span>
                {result.startingBalanceB < 0 && (
                  <span className="text-[10px] text-danger ml-1.5">({formatCurrency(result.startingBalanceB)})</span>
                )}
              </div>
              <span className={`text-xl font-bold ${getResteColor(result.resteB)}`}>
                <AnimatedNumber value={result.resteB} format={(v) => formatCurrency(Math.round(v))} />
              </span>
            </div>
          )}
          <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
            <span className="text-text-secondary font-medium">{t('monthly.household')}</span>
            <span className={`text-2xl font-bold ${getResteColor(result.resteFoyer)}`}>
              <AnimatedNumber value={result.resteFoyer} format={(v) => formatCurrency(Math.round(v))} />
            </span>
          </div>
        </div>
      </Card>

      {/* Repartition */}
      {household?.personBName ? (
        <Card>
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('monthly.distribution')}</h2>
          <div className="space-y-2 text-sm">
            {/* Charges communes */}
            <div className="flex justify-between text-text-muted">
              <span>{t('monthly.commonCharges')}</span>
              <span className="tabular-nums">{formatCurrency(result.totalCommon)}</span>
            </div>
            {result.otherIncomeCommon > 0 && (
              <>
                <div className="flex justify-between pl-3 text-success text-xs">
                  <span>- {t('monthly.otherIncomeCommon')}</span>
                  <span className="tabular-nums">-{formatCurrency(result.otherIncomeCommon)}</span>
                </div>
                <div className="flex justify-between pl-3 text-text-muted text-xs font-medium">
                  <span>= Net à partager</span>
                  <span className="tabular-nums">{formatCurrency(result.netCommonCharges)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between pl-3">
              <span style={{ color: household?.personAColor }}>
                {t('monthly.share', { name: household.personAName, percent: Math.round((result.ratio || 0.5) * 100) })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareA)}</span>
            </div>
            <div className="flex justify-between pl-3">
              <span style={{ color: household?.personBColor }}>
                {t('monthly.share', { name: household.personBName, percent: Math.round((1 - (result.ratio || 0.5)) * 100) })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareB)}</span>
            </div>

            {/* Charges perso */}
            {(result.personalACharges > 0 || result.personalBCharges > 0) && (
              <>
                <div className="border-t border-white/[0.06] pt-2 mt-2" />
                {result.personalACharges > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: household?.personAColor }}>
                      {t('monthly.personalChargesOf', { name: household.personAName })}
                    </span>
                    <span className="tabular-nums">{formatCurrency(result.personalACharges)}</span>
                  </div>
                )}
                {result.personalBCharges > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: household?.personBColor }}>
                      {t('monthly.personalChargesOf', { name: household.personBName })}
                    </span>
                    <span className="tabular-nums">{formatCurrency(result.personalBCharges)}</span>
                  </div>
                )}
              </>
            )}

            {/* Total par personne */}
            <div className="border-t border-white/[0.06] pt-2 mt-2" />
            <div className="flex justify-between font-semibold">
              <span style={{ color: household?.personAColor }}>
                {t('monthly.totalChargesOf', { name: household.personAName })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareA + result.personalACharges)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span style={{ color: household?.personBColor }}>
                {t('monthly.totalChargesOf', { name: household.personBName })}
              </span>
              <span className="tabular-nums">{formatCurrency(result.shareB + result.personalBCharges)}</span>
            </div>
          </div>
        </Card>
      ) : <div className="hidden lg:block" />}
      </div>

      {/* Virements effectues + Regularisation */}
      {household?.personBName && result.totalCommon > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={12} className="text-success" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('monthly.transfersDone')}</h2>
          </div>
          <p className="text-[11px] text-text-muted mb-3">
            {t('monthly.transfersHint')}
          </p>
          <div className="space-y-3">
            <Input
              label={t('monthly.transferredBy', { name: household.personAName })}
              type="number"
              value={entry?.transferredA ?? ''}
              onChange={(e) => handleIncomeChange('transferredA', e.target.value)}
              placeholder="0"
              suffix="€"
            />
            <Input
              label={t('monthly.transferredBy', { name: household.personBName })}
              type="number"
              value={entry?.transferredB ?? ''}
              onChange={(e) => handleIncomeChange('transferredB', e.target.value)}
              placeholder="0"
              suffix="€"
            />
          </div>

          {/* Regularisation */}
          {((entry?.transferredA || 0) > 0 || (entry?.transferredB || 0) > 0) && (() => {
            const transferredA = entry?.transferredA || 0
            const transferredB = entry?.transferredB || 0
            const regulA = Math.round((result.shareA - transferredA) * 100) / 100
            const regulB = Math.round((result.shareB - transferredB) * 100) / 100
            const hasRegul = Math.abs(regulA) >= 0.01 || Math.abs(regulB) >= 0.01

            const sendCorrectionNotif = async () => {
              if (!isSupabaseConfigured() || !supabase) return
              const { data: { session: s } } = await supabase.auth.getSession()
              if (!s) return

              const lines = []
              if (Math.abs(regulA) >= 0.01) {
                lines.push(regulA > 0
                  ? `${household.personAName} doit verser ${formatCurrency(regulA)} supplementaires`
                  : `${household.personAName} a un trop-percu de ${formatCurrency(Math.abs(regulA))}`)
              }
              if (Math.abs(regulB) >= 0.01) {
                lines.push(regulB > 0
                  ? `${household.personBName} doit verser ${formatCurrency(regulB)} supplementaires`
                  : `${household.personBName} a un trop-percu de ${formatCurrency(Math.abs(regulB))}`)
              }

              try {
                await createNotification({
                  householdId: household.id,
                  actorId: s.user.id,
                  type: 'charge_updated',
                  title: t('monthly.correctionNotifTitle', { month: formatMonth(currentMonth) }),
                  body: lines.join(' · '),
                  metadata: { month: currentMonth },
                })
                toast.success(t('monthly.correctionNotifSent'))
              } catch {
                toast.error(t('monthly.correctionNotifError'))
              }
            }

            return (
              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpDown size={12} className={hasRegul ? 'text-warning' : 'text-success'} />
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    {hasRegul ? t('monthly.regularization') : t('monthly.upToDate')}
                  </span>
                </div>
                {!hasRegul ? (
                  <p className="text-sm text-success">{t('monthly.transfersMatch')}</p>
                ) : (
                  <div className="space-y-2">
                    {Math.abs(regulA) >= 0.01 && (
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: household.personAColor }}>{household.personAName}</span>
                        <span className={`font-semibold ${regulA > 0 ? 'text-danger' : 'text-success'}`}>
                          {regulA > 0 ? t('monthly.mustTransfer', { amount: formatCurrency(regulA) }) : t('monthly.overTransferred', { amount: formatCurrency(Math.abs(regulA)) })}
                        </span>
                      </div>
                    )}
                    {Math.abs(regulB) >= 0.01 && (
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: household.personBColor }}>{household.personBName}</span>
                        <span className={`font-semibold ${regulB > 0 ? 'text-danger' : 'text-success'}`}>
                          {regulB > 0 ? t('monthly.mustTransfer', { amount: formatCurrency(regulB) }) : t('monthly.overTransferred', { amount: formatCurrency(Math.abs(regulB)) })}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={sendCorrectionNotif}
                      className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-brand/10 text-brand text-xs font-medium hover:bg-brand/20 transition-colors cursor-pointer"
                    >
                      <Send size={12} />
                      {t('monthly.sendCorrectionNotif')}
                    </button>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}

      {/* Edit charge amount modal */}
      <Modal
        isOpen={!!editingCharge}
        onClose={() => setEditingCharge(null)}
        title={editingCharge?.name || t('monthly.editAmount')}
      >
        <div className="space-y-4">
          <Input
            label={t('common.amount')}
            type="number"
            inputMode="decimal"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            suffix="€"
            autoFocus
          />
          <button
            onClick={() => {
              if (editingCharge) {
                updateVariable(currentMonth, editingCharge.id, parseFloat(editAmount) || 0)
                setEditingCharge(null)
              }
            }}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25 transition-all cursor-pointer"
          >
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
