import { useState, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useChargesStore } from '../stores/chargesStore'
import { parseCSV, detectColumns, detectRecurring } from '../utils/csvParser'
import { parsePDF } from '../utils/pdfParser'
import { formatCurrency, getTranslatedCategories } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { Upload, Check, X, Loader2, FileText, Tag, HelpCircle, Shield, Pencil, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportPage() {
  const { t } = useTranslation()
  const { addFixedCharge, matchCategory, addCategoryRule, fixedCharges } = useChargesStore()
  const fileInputRef = useRef(null)
  const categories = getTranslatedCategories(t)

  const normalize = useCallback((str) => str.toUpperCase().replace(/[^A-Z0-9]/g, ''), [])

  const existingNormalized = useMemo(
    () => fixedCharges.map((c) => ({ name: c.name, amount: c.amount, normalized: normalize(c.name) })),
    [fixedCharges, normalize]
  )

  const findDuplicate = useCallback((name) => {
    const norm = normalize(name)
    const match = existingNormalized.find((c) => c.normalized === norm)
    if (match) return { name: match.name, amount: match.amount }
    // Fuzzy: check if one contains the other (at least 4 chars)
    if (norm.length >= 4) {
      const fuzzy = existingNormalized.find(
        (c) => (c.normalized.includes(norm) || norm.includes(c.normalized)) && c.normalized.length >= 4
      )
      if (fuzzy) return { name: fuzzy.name, amount: fuzzy.amount }
    }
    return null
  }, [normalize, existingNormalized])

  const [status, setStatus] = useState('idle')
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [added, setAdded] = useState(new Set())
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [categoryOverrides, setCategoryOverrides] = useState({})
  const [nameOverrides, setNameOverrides] = useState({})
  const [amountOverrides, setAmountOverrides] = useState({})
  const [editing, setEditing] = useState(null)
  const [confirmDuplicate, setConfirmDuplicate] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux (max 10 Mo)')
      return
    }

    setStatus('parsing')
    setError(null)
    setSuggestions([])
    setDismissed(new Set())
    setAdded(new Set())
    setCategoryOverrides({})

    try {
      const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
      const result = isPDF ? await parsePDF(file) : await parseCSV(file)

      if (!result.data || result.data.length === 0) throw new Error(t('import.emptyFile'))

      const headers = result.meta.fields || Object.keys(result.data[0])
      const columns = detectColumns(headers)

      if (!columns.dateCol || !columns.labelCol) {
        throw new Error(t('import.columnsNotDetected'))
      }

      const recurring = detectRecurring(result.data, columns)

      const enriched = recurring.map((s) => ({
        ...s,
        suggestedCategory: matchCategory(s.suggestedName),
      }))

      setStats({ totalRows: result.data.length, detectedRecurring: enriched.length, fileName: file.name })
      setSuggestions(enriched)
      setStatus('detected')
      toast.success(t('import.recurringDetected', { count: enriched.length }))
    } catch (err) {
      if (err.message === 'NO_TRANSACTIONS') {
        setError(t('import.noTransactionsInPDF'))
      } else {
        setError(err.message)
      }
      setStatus('error')
      toast.error(t('import.parseError'))
    }

    e.target.value = ''
  }

  const getCategory = (suggestion) => {
    return categoryOverrides[suggestion.suggestedName] || suggestion.suggestedCategory || 'autre'
  }

  const handleCategoryChange = (name, category) => {
    setCategoryOverrides((prev) => ({ ...prev, [name]: category }))
  }

  const getName = (s) => nameOverrides[s.suggestedName] ?? s.suggestedName
  const getAmount = (s) => amountOverrides[s.suggestedName] ?? s.avgAmount

  const doAdd = (suggestion) => {
    const category = getCategory(suggestion)
    const name = getName(suggestion)
    const amount = getAmount(suggestion)

    addFixedCharge({
      name,
      amount,
      payer: 'common',
      frequency: suggestion.frequency,
      dayOfMonth: 1,
      category,
      paymentDelayMonths: 0,
    })

    addCategoryRule(name, category)

    setAdded((prev) => new Set([...prev, suggestion.suggestedName]))
    setEditing(null)
    setConfirmDuplicate(null)
    toast.success(t('import.added', { name }))
  }

  const handleAdd = (suggestion) => {
    const name = getName(suggestion)
    const duplicate = findDuplicate(name)
    if (duplicate) {
      setConfirmDuplicate({ suggestion, existingName: duplicate.name, existingAmount: duplicate.amount })
    } else {
      doAdd(suggestion)
    }
  }

  const handleDismiss = (name) => {
    setDismissed((prev) => new Set([...prev, name]))
  }

  const activeSuggestions = suggestions.filter(
    (s) => !dismissed.has(s.suggestedName) && !added.has(s.suggestedName)
  )

  return (
    <div className="space-y-4">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {t('import.title')}
      </motion.h1>

      <Card>
        <div className="text-center py-5">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-brand" />
          </div>
          <h2 className="text-base font-semibold mb-1">{t('import.uploadDescription')}</h2>
          <p className="text-text-muted text-xs mb-1 max-w-xs mx-auto">
            {t('import.uploadSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-text-muted text-[11px] mb-5">
            <Shield size={12} />
            <span>{t('import.localProcessing')}</span>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.pdf" onChange={handleFileSelect} className="hidden" />
          <Button onClick={() => fileInputRef.current?.click()} size="lg">
            <Upload size={16} className="inline mr-2" />
            {t('import.chooseFile')}
          </Button>
        </div>
      </Card>

      {status === 'parsing' && (
        <Card>
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 size={20} className="animate-spin text-brand" />
            <span className="text-text-secondary text-sm">{t('import.analyzing')}</span>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card className="!border-danger/30">
          <p className="text-danger text-sm">{error}</p>
        </Card>
      )}

      {status === 'detected' && (
        <>
          {stats && (
            <Card>
              <div className="text-xs text-text-secondary space-y-1">
                <div>{t('import.file', { name: stats.fileName })}</div>
                <div>{t('import.transactionsAnalyzed', { count: stats.totalRows })}</div>
                <div className="text-brand font-medium">{t('import.recurringCharges', { count: stats.detectedRecurring })}</div>
              </div>
            </Card>
          )}

          {added.size > 0 && (
            <Card className="!border-success/30 !bg-success/5">
              <p className="text-success text-sm">{t('import.chargesAdded', { count: added.size })}</p>
            </Card>
          )}

          {activeSuggestions.length === 0 && added.size > 0 && (
            <Card>
              <p className="text-center text-text-secondary py-4 text-sm">
                {t('import.allProcessed')}
              </p>
            </Card>
          )}

          <AnimatePresence>
            <div className="space-y-2">
              {activeSuggestions.map((s, i) => (
                <motion.div
                  key={s.suggestedName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    {editing === s.suggestedName ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-text-muted mb-1 block">{t('import.editName')}</label>
                          <input
                            type="text"
                            value={getName(s)}
                            onChange={(e) => setNameOverrides((p) => ({ ...p, [s.suggestedName]: e.target.value }))}
                            className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-base text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-text-muted mb-1 block">{t('import.editAmount')}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={getAmount(s)}
                            onChange={(e) => setAmountOverrides((p) => ({ ...p, [s.suggestedName]: parseFloat(e.target.value) || 0 }))}
                            className="w-full text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-base text-text-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag size={10} className="text-text-muted flex-shrink-0" />
                          <select
                            value={getCategory(s)}
                            onChange={(e) => handleCategoryChange(s.suggestedName, e.target.value)}
                            className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-base text-text-secondary"
                          >
                            {categories.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => handleAdd(s)}>
                            <Check size={12} className="mr-1" /> {t('common.add')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                            {t('common.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{getName(s)}</span>
                            {findDuplicate(getName(s)) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20">
                                <AlertTriangle size={10} /> {t('import.alreadyExists')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {formatCurrency(getAmount(s), true)}/mois — {s.occurrences}x
                            {s.isStable && <span className="text-success ml-1">{t('import.stable')}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Tag size={10} className="text-text-muted flex-shrink-0" />
                            <select
                              value={getCategory(s)}
                              onChange={(e) => handleCategoryChange(s.suggestedName, e.target.value)}
                              className="text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-text-secondary"
                            >
                              {categories.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(s.suggestedName)} aria-label={t('common.edit')}>
                            <Pencil size={12} />
                          </Button>
                          <Button size="sm" onClick={() => handleAdd(s)}>
                            <Check size={12} className="mr-1" /> {t('common.add')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDismiss(s.suggestedName)}>
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={14} className="text-brand" />
          <h3 className="text-xs font-semibold text-text-primary">{t('import.howToTitle')}</h3>
        </div>
        <ol className="text-xs text-text-muted space-y-2">
          {t('import.howToSteps', { returnObjects: true }).map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="text-brand" />
          <h3 className="text-xs font-semibold text-text-primary">{t('import.howItWorksTitle')}</h3>
        </div>
        <ul className="text-xs text-text-muted space-y-2">
          {t('import.howItWorksSteps', { returnObjects: true }).map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand flex-shrink-0">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-text-muted mt-3 opacity-60">{t('import.howItWorksFormats')}</p>
      </Card>

      <Modal
        isOpen={!!confirmDuplicate}
        onClose={() => setConfirmDuplicate(null)}
        title={t('import.duplicateTitle')}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-text-secondary">
                {t('import.duplicateMessage')}
              </p>
            </div>
            <div className="ml-7 text-xs space-y-1.5">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.04]">
                <span className="text-text-muted">{t('import.existingCharge')}</span>
                <span className="font-medium text-text-primary">{confirmDuplicate?.existingName} — {formatCurrency(confirmDuplicate?.existingAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/[0.04]">
                <span className="text-text-muted">{t('import.newCharge')}</span>
                <span className="font-medium text-brand">{confirmDuplicate?.suggestion && getName(confirmDuplicate.suggestion)} — {confirmDuplicate?.suggestion && formatCurrency(getAmount(confirmDuplicate.suggestion))}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => doAdd(confirmDuplicate.suggestion)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-warning/20 hover:bg-warning/30 text-warning transition-all cursor-pointer"
            >
              {t('import.addAnyway')}
            </button>
            <button
              onClick={() => setConfirmDuplicate(null)}
              className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-card-bg border border-border-default text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
