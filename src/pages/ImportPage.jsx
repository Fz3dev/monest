import { useState, useRef } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { parseCSV, detectColumns, detectRecurring } from '../utils/csvParser'
import { formatCurrency, PAYER_OPTIONS } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import { Upload, Check, X, RefreshCw, FileText } from 'lucide-react'

export default function ImportPage() {
  const household = useHouseholdStore((s) => s.household)
  const addFixedCharge = useChargesStore((s) => s.addFixedCharge)
  const fileInputRef = useRef(null)

  const [status, setStatus] = useState('idle') // idle, parsing, detected, error
  const [suggestions, setSuggestions] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [added, setAdded] = useState(new Set())
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('parsing')
    setError(null)
    setSuggestions([])
    setDismissed(new Set())
    setAdded(new Set())

    try {
      const result = await parseCSV(file)

      if (!result.data || result.data.length === 0) {
        throw new Error('Fichier vide ou format non reconnu')
      }

      const headers = result.meta.fields || Object.keys(result.data[0])
      const columns = detectColumns(headers)

      if (!columns.dateCol || !columns.labelCol) {
        throw new Error('Colonnes date/libellé non détectées. Vérifiez le format du CSV.')
      }

      const recurring = detectRecurring(result.data, columns)

      setStats({
        totalRows: result.data.length,
        detectedRecurring: recurring.length,
        fileName: file.name,
      })
      setSuggestions(recurring)
      setStatus('detected')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }

    // Reset file input
    e.target.value = ''
  }

  const handleAdd = (suggestion) => {
    addFixedCharge({
      name: suggestion.suggestedName,
      amount: suggestion.avgAmount,
      payer: 'common',
      frequency: suggestion.frequency,
      dayOfMonth: 1,
      category: 'autre',
      paymentDelayMonths: 0,
    })
    setAdded((prev) => new Set([...prev, suggestion.suggestedName]))
  }

  const handleDismiss = (name) => {
    setDismissed((prev) => new Set([...prev, name]))
  }

  const activeSuggestions = suggestions.filter(
    (s) => !dismissed.has(s.suggestedName) && !added.has(s.suggestedName)
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Import CSV</h1>

      <Card>
        <div className="text-center">
          <FileText size={48} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-400 text-sm mb-4">
            Importez votre relevé bancaire CSV pour détecter automatiquement vos charges récurrentes.
            <br />
            <span className="text-xs text-slate-500">
              Le fichier est traité localement, jamais envoyé sur un serveur.
            </span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} size="lg">
            <Upload size={16} className="inline mr-2" />
            Choisir un fichier CSV
          </Button>
        </div>
      </Card>

      {status === 'parsing' && (
        <Card>
          <div className="flex items-center justify-center gap-3 py-4">
            <RefreshCw size={20} className="animate-spin text-brand" />
            <span className="text-slate-400">Analyse en cours...</span>
          </div>
        </Card>
      )}

      {status === 'error' && (
        <Card className="border-red-500/30">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {status === 'detected' && (
        <>
          {stats && (
            <Card>
              <div className="text-sm text-slate-400 space-y-1">
                <div>Fichier : {stats.fileName}</div>
                <div>{stats.totalRows} transactions analysées</div>
                <div>{stats.detectedRecurring} charges récurrentes détectées</div>
              </div>
            </Card>
          )}

          {added.size > 0 && (
            <Card className="border-green-500/30">
              <p className="text-green-400 text-sm">
                {added.size} charge(s) ajoutée(s) avec succès
              </p>
            </Card>
          )}

          {activeSuggestions.length === 0 && added.size > 0 && (
            <Card>
              <p className="text-center text-slate-400 py-4">
                Toutes les suggestions ont été traitées. Vérifiez vos charges dans l'onglet Charges.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            {activeSuggestions.map((suggestion) => (
              <Card key={suggestion.suggestedName} className="border-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw size={14} className="text-brand" />
                      <span className="font-medium text-sm">{suggestion.suggestedName}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      ~{formatCurrency(suggestion.avgAmount, true)}/mois — détecté {suggestion.occurrences}x
                      {suggestion.isStable && (
                        <span className="text-green-400 ml-1">(stable)</span>
                      )}
                    </div>
                    {suggestion.originalLabels.length > 0 && (
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {suggestion.originalLabels[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => handleAdd(suggestion)}>
                      <Check size={14} className="mr-1" />
                      Ajouter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(suggestion.suggestedName)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Formats supportés */}
      <Card>
        <h3 className="text-sm font-medium text-slate-400 mb-2">Formats supportés</h3>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>BoursoBank (séparateur ; , encodage Latin-1)</li>
          <li>Détection automatique pour les autres banques</li>
          <li>Colonnes requises : Date, Libellé, Débit (ou Montant)</li>
        </ul>
      </Card>
    </div>
  )
}
