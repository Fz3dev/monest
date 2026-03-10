import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Download, Upload, Trash2, User, Database, LogOut, Users, Share2, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const COLORS = [
  '#6C63FF', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#22c55e',
]

export default function SettingsPage({ session, saveHousehold, createInvite }) {
  const { household, updateHousehold, resetHousehold } = useHouseholdStore()
  const chargesStore = useChargesStore()
  const monthlyStore = useMonthlyStore()
  const savingsStore = useSavingsStore()
  const expenseStore = useExpenseStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef(null)

  const handleExport = () => {
    const data = {
      household,
      fixedCharges: chargesStore.fixedCharges,
      installmentPayments: chargesStore.installmentPayments,
      plannedExpenses: chargesStore.plannedExpenses,
      monthlyEntries: monthlyStore.entries,
      savingsGoals: savingsStore.goals,
      expenses: expenseStore.expenses,
      exportDate: new Date().toISOString(),
      version: 2,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monest-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup exporte')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.household) useHouseholdStore.setState({ household: data.household })
      if (data.fixedCharges) {
        useChargesStore.setState({
          fixedCharges: data.fixedCharges,
          installmentPayments: data.installmentPayments || [],
          plannedExpenses: data.plannedExpenses || [],
        })
      }
      if (data.monthlyEntries) useMonthlyStore.setState({ entries: data.monthlyEntries })
      if (data.savingsGoals) useSavingsStore.setState({ goals: data.savingsGoals })
      if (data.expenses) useExpenseStore.setState({ expenses: data.expenses })
      toast.success('Donnees restaurees')
    } catch {
      toast.error('Fichier invalide')
    }
    e.target.value = ''
  }

  const handleReset = () => {
    localStorage.clear()
    resetHousehold()
    window.location.reload()
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    localStorage.clear()
    resetHousehold()
    window.location.reload()
  }

  const handleUpdate = (updates) => {
    updateHousehold(updates)
    if (saveHousehold && household) {
      saveHousehold({ ...household, ...updates })
    }
  }

  const [inviteLoading, setInviteLoading] = useState(false)

  const handleCopyInvite = async () => {
    if (!createInvite) return
    setInviteLoading(true)
    try {
      const code = await createInvite()
      if (!code) {
        toast.error('Erreur lors de la creation de l\'invitation')
        return
      }
      const url = `${window.location.origin}?invite=${code}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Lien d\'invitation copie !')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('Erreur lors de la copie')
    } finally {
      setInviteLoading(false)
    }
  }

  const modelLabels = {
    common_and_personal: 'Commun + Perso',
    full_common: 'Tout commun',
    full_personal: 'Tout perso',
    solo: 'Solo',
  }

  return (
    <div className="space-y-4">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Reglages
      </motion.h1>

      {/* Account info */}
      {session && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Compte</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Email</span>
              <span className="text-text-secondary">{session.user.email}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Invite partner */}
      {session && household?.configModel !== 'solo' && (
        <Card className="!border-brand/15">
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Inviter {household?.personBName || 'partenaire'}</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">
            Partagez ce lien pour que votre partenaire puisse se connecter et acceder au budget partage.
          </p>
          <Button variant="secondary" size="sm" onClick={handleCopyInvite} disabled={inviteLoading} className="w-full">
            {inviteLoading ? <Loader2 size={14} className="inline mr-1.5 animate-spin" /> : copied ? <Check size={14} className="inline mr-1.5 text-success" /> : <Copy size={14} className="inline mr-1.5" />}
            {inviteLoading ? 'Generation...' : copied ? 'Lien copie !' : 'Generer un lien d\'invitation'}
          </Button>
        </Card>
      )}

      {/* Household info */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Foyer</h2>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-brand hover:text-brand-light transition-colors cursor-pointer"
          >
            {editing ? 'Terminer' : 'Modifier'}
          </button>
        </div>

        {!editing ? (
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Nom</span>
              <span>{household?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Modele</span>
              <span>{modelLabels[household?.configModel] || household?.configModel}</span>
            </div>
            {household?.configModel !== 'solo' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Repartition</span>
                <span>
                  {Math.round((household?.splitRatio || 0.5) * 100)}/
                  {Math.round((1 - (household?.splitRatio || 0.5)) * 100)}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Votre prenom"
              value={household?.personAName || ''}
              onChange={(e) => handleUpdate({ personAName: e.target.value, name: household?.personBName ? `${e.target.value} & ${household.personBName}` : e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Votre couleur</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleUpdate({ personAColor: c })}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                      household?.personAColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Couleur ${c}`}
                  />
                ))}
              </div>
            </div>
            {household?.configModel !== 'solo' && (
              <>
                <Input
                  label="Prenom partenaire"
                  value={household?.personBName || ''}
                  onChange={(e) => handleUpdate({ personBName: e.target.value, name: `${household.personAName} & ${e.target.value}` })}
                />
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Sa couleur</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleUpdate({ personBColor: c })}
                        className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                          household?.personBColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Couleur ${c}`}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Part de {household?.personAName} : {Math.round((household?.splitRatio || 0.5) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(household?.splitRatio || 0.5) * 100}
                    onChange={(e) => handleUpdate({ splitRatio: parseInt(e.target.value) / 100 })}
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{household?.personAName}: {Math.round((household?.splitRatio || 0.5) * 100)}%</span>
                    <span>{household?.personBName}: {Math.round((1 - (household?.splitRatio || 0.5)) * 100)}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Stats */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Database size={14} className="text-brand" />
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Donnees</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Charges fixes</span>
            <span>{chargesStore.fixedCharges.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Paiements etales</span>
            <span>{chargesStore.installmentPayments.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Depenses planifiees</span>
            <span>{chargesStore.plannedExpenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Objectifs d'epargne</span>
            <span>{savingsStore.goals.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Depenses rapides</span>
            <span>{expenseStore.expenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Mois saisis</span>
            <span>{Object.keys(monthlyStore.entries).length}</span>
          </div>
        </div>
      </Card>

      {/* Export / Import */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={handleExport} className="w-full">
          <Download size={14} className="inline mr-1.5" /> Exporter
        </Button>
        <div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
            <Upload size={14} className="inline mr-1.5" /> Restaurer
          </Button>
        </div>
      </div>

      {/* Logout */}
      {session && (
        <Button variant="secondary" onClick={handleLogout} className="w-full">
          <LogOut size={14} className="inline mr-1.5" /> Se deconnecter
        </Button>
      )}

      {/* Reset */}
      <div className="pt-4 border-t border-white/[0.06]">
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)} className="w-full">
            <Trash2 size={14} className="inline mr-1.5" /> Reinitialiser l'application
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-danger text-center">
              Toutes vos donnees seront supprimees. Irreversible.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmReset(false)} className="flex-1">Annuler</Button>
              <Button variant="danger" onClick={handleReset} className="flex-1">Confirmer</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
