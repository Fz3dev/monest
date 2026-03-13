import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { formatCurrency } from '../utils/format'
import { exportCSV, exportPDF } from '../utils/chargesExport'
import type { ExportFormat, ChargeTypeFilter } from '../utils/chargesExport'
import type { Payer } from '../types'
import { PAYER } from '../types'
import Modal from './ui/Modal'
import Button from './ui/Button'
import { FileSpreadsheet, FileText, Download, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)

  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [chargeTypes, setChargeTypes] = useState<Set<ChargeTypeFilter>>(new Set(['fixed', 'installment', 'planned']))
  const [selectedPayers, setSelectedPayers] = useState<Set<Payer>>(new Set(['common', 'person_a', 'person_b']))
  const [exporting, setExporting] = useState(false)

  const isCouple = !!household?.personBName

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

  // Count matching charges for preview
  const matchCount = useMemo(() => {
    let count = 0
    const payers = selectedPayers
    if (chargeTypes.has('fixed')) count += fixedCharges.filter((c) => c.active && payers.has(c.payer)).length
    if (chargeTypes.has('installment')) count += installmentPayments.filter((c) => payers.has(c.payer)).length
    if (chargeTypes.has('planned')) count += plannedExpenses.filter((c) => payers.has(c.payer)).length
    return count
  }, [chargeTypes, selectedPayers, fixedCharges, installmentPayments, plannedExpenses])

  const matchTotal = useMemo(() => {
    let total = 0
    const payers = selectedPayers
    if (chargeTypes.has('fixed')) total += fixedCharges.filter((c) => c.active && payers.has(c.payer)).reduce((s, c) => s + c.amount, 0)
    if (chargeTypes.has('installment')) total += installmentPayments.filter((c) => payers.has(c.payer)).reduce((s, c) => s + c.installmentAmount, 0)
    if (chargeTypes.has('planned')) total += plannedExpenses.filter((c) => payers.has(c.payer)).reduce((s, c) => s + c.estimatedAmount, 0)
    return total
  }, [chargeTypes, selectedPayers, fixedCharges, installmentPayments, plannedExpenses])

  const handleExport = async () => {
    if (matchCount === 0) {
      toast.error(t('export.noData'))
      return
    }

    setExporting(true)
    try {
      const opts = {
        format,
        chargeTypes: [...chargeTypes],
        payers: [...selectedPayers],
        fixedCharges,
        installmentPayments,
        plannedExpenses,
        household,
        t,
      }

      if (format === 'csv') {
        await exportCSV(opts)
      } else {
        await exportPDF(opts)
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
    { value: 'fixed', label: t('charges.tabFixed'), count: fixedCharges.filter((c) => c.active).length },
    { value: 'installment', label: t('charges.tabInstallment'), count: installmentPayments.length },
    { value: 'planned', label: t('charges.tabPlanned'), count: plannedExpenses.length },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('export.title')}>
      <div className="space-y-5">
        {/* Format selection */}
        <div>
          <label className="text-xs font-semibold text-text-secondary mb-2 block">{t('export.format')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormat('pdf')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                format === 'pdf'
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText size={20} />
              <div className="text-left">
                <div className="text-sm font-semibold">PDF</div>
                <div className="text-[10px] opacity-70">{t('export.pdfDesc')}</div>
              </div>
              {format === 'pdf' && <Check size={14} className="ml-auto" />}
            </button>
            <button
              onClick={() => setFormat('csv')}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                format === 'csv'
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/[0.08] bg-white/[0.03] text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileSpreadsheet size={20} />
              <div className="text-left">
                <div className="text-sm font-semibold">CSV</div>
                <div className="text-[10px] opacity-70">{t('export.csvDesc')}</div>
              </div>
              {format === 'csv' && <Check size={14} className="ml-auto" />}
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
            key={`${matchCount}-${matchTotal}`}
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
          className="w-full"
        >
          {exporting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Download size={16} className="mr-2" />
          )}
          {exporting ? t('export.exporting') : t('export.download', { format: format.toUpperCase() })}
        </Button>
      </div>
    </Modal>
  )
}
