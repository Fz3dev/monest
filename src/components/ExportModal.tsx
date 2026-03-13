import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { format } from 'date-fns'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useChargeSnapshots } from '../hooks/useChargeSnapshots'
import { formatCurrency } from '../utils/format'
import { exportCSV, exportPDF, exportMonthCSV, exportMonthPDF } from '../utils/chargesExport'
import type { ExportFormat, ChargeTypeFilter } from '../utils/chargesExport'
import type { Payer } from '../types'
import { PAYER } from '../types'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { FileSpreadsheet, FileText, Download, Loader2, Check, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

const MONTH_NAMES = [
  'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
  'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
]

function getMonthLabel(month: string): string {
  const [year, m] = month.split('-')
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${year.slice(2)}`
}

function getMonthFullLabel(month: string, t: (key: string, opts?: Record<string, string>) => string): string {
  const [year, m] = month.split('-')
  const monthName = t(`export.months.${parseInt(m, 10) - 1}`)
  return `${monthName} ${year}`
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const entries = useMonthlyStore((s) => s.entries)
  const { getSnapshotForMonth } = useChargeSnapshots()

  const currentMonth = format(new Date(), 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [chargeTypes, setChargeTypes] = useState<Set<ChargeTypeFilter>>(new Set(['fixed', 'installment', 'planned']))
  const [selectedPayers, setSelectedPayers] = useState<Set<Payer>>(new Set(['common', 'person_a', 'person_b']))
  const [exporting, setExporting] = useState(false)

  const monthScrollRef = useRef<HTMLDivElement>(null)
  const activeMonthRef = useRef<HTMLButtonElement>(null)

  const isCouple = !!household?.personBName
  const isCurrentMonth = selectedMonth === currentMonth

  // Only show months that have data (monthly entries) + current month
  const months = useMemo(() => {
    const pastMonths = Object.keys(entries)
      .filter((m) => m < currentMonth)
      .sort()
    return [...pastMonths, currentMonth]
  }, [entries, currentMonth])

  // Scroll to active month pill on open
  useEffect(() => {
    if (isOpen && activeMonthRef.current && monthScrollRef.current) {
      const container = monthScrollRef.current
      const pill = activeMonthRef.current
      const scrollLeft = pill.offsetLeft - container.offsetWidth / 2 + pill.offsetWidth / 2
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [isOpen])

  const toggleChargeType = (type: ChargeTypeFilter) => {
    setChargeTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const togglePayer = (payer: Payer) => {
    setSelectedPayers((prev) => {
      const next = new Set(prev)
      if (next.has(payer)) {
        if (next.size > 1) next.delete(payer)
      } else {
        next.add(payer)
      }
      return next
    })
  }

  // Get snapshot data for the selected month
  const snapshot = useMemo(() => {
    return getSnapshotForMonth(selectedMonth)
  }, [selectedMonth, getSnapshotForMonth])

  // Filter snapshot charges by type and payer for preview
  const filteredCharges = useMemo(() => {
    return snapshot.charges.filter(
      (c) => chargeTypes.has(c.type) && selectedPayers.has(c.payer) && !c.isDisabledThisMonth
    )
  }, [snapshot, chargeTypes, selectedPayers])

  const matchCount = filteredCharges.length
  const matchTotal = filteredCharges.reduce((sum, c) => sum + c.amount, 0)

  // Charge type counts from snapshot
  const chargeTypeCounts = useMemo(() => {
    const active = snapshot.charges.filter((c) => !c.isDisabledThisMonth)
    return {
      fixed: active.filter((c) => c.type === 'fixed').length,
      installment: active.filter((c) => c.type === 'installment').length,
      planned: active.filter((c) => c.type === 'planned').length,
    }
  }, [snapshot])

  const handleExport = async () => {
    if (matchCount === 0) {
      toast.error(t('export.noData'))
      return
    }

    setExporting(true)
    try {
      if (isCurrentMonth) {
        // Current month: use raw charge arrays (existing behavior)
        const opts = {
          format: exportFormat,
          chargeTypes: [...chargeTypes],
          payers: [...selectedPayers],
          fixedCharges,
          installmentPayments,
          plannedExpenses,
          household,
          t,
        }
        if (exportFormat === 'csv') {
          await exportCSV(opts)
        } else {
          await exportPDF(opts)
        }
      } else {
        // Past month: use snapshot
        const opts = {
          format: exportFormat,
          chargeTypes: [...chargeTypes],
          payers: [...selectedPayers],
          charges: filteredCharges,
          month: selectedMonth,
          monthLabel: getMonthFullLabel(selectedMonth, t),
          household,
          t,
        }
        if (exportFormat === 'csv') {
          await exportMonthCSV(opts)
        } else {
          await exportMonthPDF(opts)
        }
      }

      toast.success(t('export.success'))
      onClose()
    } catch {
      toast.error(t('export.error'))
    } finally {
      setExporting(false)
    }
  }

  const payerOptions: { value: Payer; label: string }[] = []
  if (isCouple) {
    payerOptions.push({ value: PAYER.Common, label: t('payer.common') })
  }
  payerOptions.push({ value: PAYER.PersonA, label: household?.personAName || t('common.personA') })
  if (isCouple) {
    payerOptions.push({ value: PAYER.PersonB, label: household?.personBName || t('common.personB') })
  }

  const chargeTypeOptions: { value: ChargeTypeFilter; label: string; count: number }[] = [
    { value: 'fixed', label: t('charges.fixedTab'), count: chargeTypeCounts.fixed },
    { value: 'installment', label: t('charges.installmentTab'), count: chargeTypeCounts.installment },
    { value: 'planned', label: t('charges.plannedTab'), count: chargeTypeCounts.planned },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('export.title')}>
      <div className="space-y-5">
        {/* Month selector — only show if there are past months with data */}
        {months.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">{t('export.month')}</label>
            <div
              ref={monthScrollRef}
              className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
            >
              {months.map((m) => {
                const isActive = m === selectedMonth
                const isPast = m < currentMonth
                return (
                  <button
                    key={m}
                    ref={isActive ? activeMonthRef : undefined}
                    onClick={() => setSelectedMonth(m)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                        : 'bg-white/[0.06] text-text-muted hover:text-white'
                    }`}
                  >
                    {isPast && !isActive && <Lock size={10} className="opacity-50" />}
                    {getMonthLabel(m)}
                  </button>
                )
              })}
            </div>
            {!isCurrentMonth && (
              <div className="mt-1.5 text-[10px] text-text-muted flex items-center gap-1">
                <Lock size={10} />
                {t('export.snapshotDate', { date: getMonthFullLabel(selectedMonth, t) })}
              </div>
            )}
          </div>
        )}

        {/* Format selection */}
        <div>
          <label className="text-xs font-semibold text-text-secondary mb-2 block">{t('export.format')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                exportFormat === 'pdf'
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText size={20} />
              <div className="text-left">
                <div className="text-sm font-semibold">PDF</div>
                <div className="text-[10px] opacity-70">{t('export.pdfDesc')}</div>
              </div>
              {exportFormat === 'pdf' && <Check size={14} className="ml-auto" />}
            </button>
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                exportFormat === 'csv'
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileSpreadsheet size={20} />
              <div className="text-left">
                <div className="text-sm font-semibold">CSV</div>
                <div className="text-[10px] opacity-70">{t('export.csvDesc')}</div>
              </div>
              {exportFormat === 'csv' && <Check size={14} className="ml-auto" />}
            </button>
          </div>
        </div>

        {/* Charge type multi-select */}
        <div>
          <label className="text-xs font-semibold text-text-secondary mb-2 block">{t('export.chargeTypes')}</label>
          <div className="flex flex-wrap gap-2">
            {chargeTypeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleChargeType(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  chargeTypes.has(opt.value)
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-white/[0.06] text-text-muted hover:text-white'
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>
        </div>

        {/* Payer multi-select */}
        {payerOptions.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 block">{t('export.payerFilter')}</label>
            <div className="flex flex-wrap gap-2">
              {payerOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => togglePayer(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedPayers.has(opt.value)
                      ? 'bg-brand text-white shadow-lg shadow-brand/20'
                      : 'bg-white/[0.06] text-text-muted hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview summary */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${matchCount}-${matchTotal}-${selectedMonth}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted">{t('export.preview')}</span>
              <span className="text-sm font-semibold text-text-primary tabular-nums">
                {matchCount} {t('export.charges')} — {formatCurrency(matchTotal)}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Export button */}
        <Button
          onClick={handleExport}
          size="lg"
          disabled={exporting || matchCount === 0}
          className="w-full flex items-center justify-center gap-2"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {exporting ? t('export.exporting') : t('export.download', { format: exportFormat.toUpperCase() })}
        </Button>
      </div>
    </Modal>
  )
}
