import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useChargesStore } from '../stores/chargesStore'
import { parseCSV, detectColumns, detectRecurring } from '../utils/csvParser'
import { formatCurrency, getTranslatedCategories } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Upload, Check, X, Loader2, FileText, Tag } from 'lucide-react'
import { toast } from 'sonner'

export default function ImportPage() {
  const { t } = useTranslation()
  const { addFixedCharge, matchCategory, addCategoryRule } = useChargesStore()
  const fileInputRef = useRef(null)
  const categories = getTranslatedCategories(t)

  const [status, setStatus] = useState('idle')
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [added, setAdded] = useState(new Set())
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [categoryOverrides, setCategoryOverrides] = useState({})

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
      const result = await parseCSV(file)
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
      setError(err.message)
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

  const handleAdd = (suggestion) => {
    const category = getCategory(suggestion)

    addFixedCharge({
      name: suggestion.suggestedName,
      amount: suggestion.avgAmount,
      payer: 'common',
      frequency: suggestion.frequency,
      dayOfMonth: 1,
      category,
      paymentDelayMonths: 0,
    })

    addCategoryRule(suggestion.suggestedName, category)

    setAdded((prev) => new Set([...prev, suggestion.suggestedName]))
    toast.success(t('import.added', { name: suggestion.suggestedName }))
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
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-brand" />
          </div>
          <p className="text-text-secondary text-sm mb-1">
            {t('import.uploadDescription')}
          </p>
          <p className="text-text-muted text-xs mb-4">
            {t('import.localProcessing')}
          </p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{s.suggestedName}</span>
                        <div className="text-xs text-text-muted mt-0.5">
                          ~{formatCurrency(s.avgAmount, true)}/mois — {s.occurrences}x
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
                        <Button size="sm" onClick={() => handleAdd(s)}>
                          <Check size={12} className="mr-1" /> {t('common.add')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(s.suggestedName)}>
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </>
      )}

      <Card>
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2">{t('import.supportedFormats')}</h3>
        <ul className="text-xs text-text-muted space-y-1">
          <li>{t('import.boursobank')}</li>
          <li>{t('import.autoDetect')}</li>
          <li>{t('import.requiredColumns')}</li>
          <li>{t('import.autoCategorize')}</li>
        </ul>
      </Card>
    </div>
  )
}
