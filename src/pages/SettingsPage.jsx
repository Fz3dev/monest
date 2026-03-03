import { useState } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Settings, Trash2, Download, Upload } from 'lucide-react'

export default function SettingsPage() {
  const { household, updateHousehold, resetHousehold } = useHouseholdStore()
  const chargesStore = useChargesStore()
  const monthlyStore = useMonthlyStore()
  const [confirmReset, setConfirmReset] = useState(false)

  const handleExport = () => {
    const data = {
      household,
      fixedCharges: chargesStore.fixedCharges,
      installmentPayments: chargesStore.installmentPayments,
      plannedExpenses: chargesStore.plannedExpenses,
      monthlyEntries: monthlyStore.entries,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payme-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    localStorage.clear()
    resetHousehold()
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Card>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Foyer</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Nom</span>
            <span>{household?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Modèle</span>
            <span>{household?.configModel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Répartition</span>
            <span>
              {Math.round((household?.splitRatio || 0.5) * 100)}/
              {Math.round((1 - (household?.splitRatio || 0.5)) * 100)}
            </span>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Données</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Charges fixes</span>
            <span>{chargesStore.fixedCharges.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Paiements étalés</span>
            <span>{chargesStore.installmentPayments.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Dépenses planifiées</span>
            <span>{chargesStore.plannedExpenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Mois saisis</span>
            <span>{Object.keys(monthlyStore.entries).length}</span>
          </div>
        </div>
      </Card>

      <Button variant="secondary" onClick={handleExport} className="w-full">
        <Download size={16} className="inline mr-2" />
        Exporter mes données (JSON)
      </Button>

      <div className="pt-4 border-t border-slate-800">
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)} className="w-full">
            <Trash2 size={16} className="inline mr-2" />
            Réinitialiser l'application
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400 text-center">
              Toutes vos données seront supprimées. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmReset(false)} className="flex-1">
                Annuler
              </Button>
              <Button variant="danger" onClick={handleReset} className="flex-1">
                Confirmer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
