import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useCategoriesStore, DEFAULT_CATEGORIES } from '../stores/categoriesStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import { Download, Upload, Trash2, User, Database, LogOut, Users, Share2, Copy, Check, Loader2, UserPlus, Tag, Plus, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

const COLORS = [
  '#6C63FF', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#22c55e',
]

export default function SettingsPage({ session, saveHousehold, createInvite }) {
  const { t } = useTranslation()
  const { household, updateHousehold, resetHousehold } = useHouseholdStore()
  const { categories, updateCategoryColor, addCategory, removeCategory, resetCategories } = useCategoriesStore()
  const chargesStore = useChargesStore()
  const monthlyStore = useMonthlyStore()
  const savingsStore = useSavingsStore()
  const expenseStore = useExpenseStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#94A3B8')
  const [coupleSetup, setCoupleSetup] = useState(false)
  const [coupleForm, setCoupleForm] = useState({
    personBName: '',
    personBColor: '#ec4899',
    configModel: 'common_and_personal',
    splitRatio: 0.5,
    splitMode: '50/50',
  })
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
    toast.success(t('settings.exported'))
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
      toast.success(t('settings.dataRestored'))
    } catch {
      toast.error(t('settings.invalidFile'))
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

  const handleSwitchToCouple = () => {
    const updates = {
      personBName: coupleForm.personBName,
      personBColor: coupleForm.personBColor,
      configModel: coupleForm.configModel,
      splitRatio: coupleForm.splitRatio,
      splitMode: coupleForm.splitMode,
      name: `${household.personAName} & ${coupleForm.personBName}`,
    }
    handleUpdate(updates)
    setCoupleSetup(false)
    toast.success(t('settings.partnerAdded'))
  }

  const [inviteLoading, setInviteLoading] = useState(false)

  const handleCopyInvite = async () => {
    if (!createInvite) return
    setInviteLoading(true)
    try {
      const code = await createInvite()
      if (!code) {
        toast.error(t('settings.inviteError'))
        return
      }
      const url = `${window.location.origin}?invite=${code}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t('settings.inviteCopied'))
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error(t('settings.inviteCopyError'))
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <img src="/logo-crown.png" alt="Monest" className="w-7 h-7 lg:hidden" />
        <motion.h1
          className="text-2xl font-bold lg:text-3xl"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {t('settings.title')}
        </motion.h1>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-5 space-y-4 lg:space-y-0">
      <div className="space-y-4">
      {/* Account info */}
      {session && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.account')}</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('settings.email')}</span>
              <span className="text-text-secondary">{session.user.email}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Solo → Couple upgrade */}
      {household?.configModel === 'solo' && (
        <Card className="!border-brand/15">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.addPartner')}</h2>
          </div>
          {!coupleSetup ? (
            <>
              <p className="text-xs text-text-muted mb-3">{t('settings.addPartnerDescription')}</p>
              <Button variant="secondary" size="sm" onClick={() => setCoupleSetup(true)} className="w-full">
                <UserPlus size={14} className="inline mr-1.5" />
                {t('settings.switchToCouple')}
              </Button>
            </>
          ) : (
            <div className="space-y-3 mt-2">
              <Input
                label={t('settings.partnerFirstName')}
                value={coupleForm.personBName}
                onChange={(e) => setCoupleForm((f) => ({ ...f, personBName: e.target.value }))}
                placeholder="Ex: Carla"
                autoFocus
              />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('settings.partnerColor')}</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCoupleForm((f) => ({ ...f, personBColor: c }))}
                      className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                        coupleForm.personBColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={t('settings.colorLabel', { color: c })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('settings.model')}</label>
                <div className="space-y-1.5">
                  {[
                    { value: 'common_and_personal', label: t('settings.modelLabels.common_and_personal') },
                    { value: 'full_common', label: t('settings.modelLabels.full_common') },
                    { value: 'full_personal', label: t('settings.modelLabels.full_personal') },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setCoupleForm((f) => ({ ...f, configModel: m.value }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                        coupleForm.configModel === m.value
                          ? 'bg-brand/10 text-brand border border-brand/30'
                          : 'bg-white/[0.04] text-text-secondary border border-transparent hover:border-white/[0.08]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  {t('settings.shareOf', { name: household?.personAName, percent: Math.round(coupleForm.splitRatio * 100) })}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={coupleForm.splitRatio * 100}
                  onChange={(e) => setCoupleForm((f) => ({ ...f, splitRatio: parseInt(e.target.value) / 100 }))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{household?.personAName}: {Math.round(coupleForm.splitRatio * 100)}%</span>
                  <span>{coupleForm.personBName || '...'}: {Math.round((1 - coupleForm.splitRatio) * 100)}%</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm" onClick={() => setCoupleSetup(false)} className="flex-1">{t('common.cancel')}</Button>
                <Button size="sm" onClick={handleSwitchToCouple} disabled={!coupleForm.personBName.trim()} className="flex-1">{t('common.confirm')}</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Invite partner */}
      {session && household?.configModel !== 'solo' && (
        <Card className="!border-brand/15">
          <div className="flex items-center gap-2 mb-2">
            <Share2 size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.inviteTitle', { name: household?.personBName || 'partenaire' })}</h2>
          </div>
          <p className="text-xs text-text-muted mb-3">
            {t('settings.inviteDescription')}
          </p>
          <Button variant="secondary" size="sm" onClick={handleCopyInvite} disabled={inviteLoading} className="w-full">
            {inviteLoading ? <Loader2 size={14} className="inline mr-1.5 animate-spin" /> : copied ? <Check size={14} className="inline mr-1.5 text-success" /> : <Copy size={14} className="inline mr-1.5" />}
            {inviteLoading ? t('settings.generating') : copied ? t('settings.linkCopied') : t('settings.generateInvite')}
          </Button>
        </Card>
      )}

      </div>
      <div className="space-y-4">
      {/* Household info */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.household')}</h2>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-brand hover:text-brand-light transition-colors cursor-pointer"
          >
            {editing ? t('common.finish') : t('common.edit')}
          </button>
        </div>

        {!editing ? (
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('settings.name')}</span>
              <span>{household?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('settings.model')}</span>
              <span>{t(`settings.modelLabels.${household?.configModel}`, { defaultValue: household?.configModel })}</span>
            </div>
            {household?.configModel !== 'solo' && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('settings.distribution')}</span>
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
              label={t('settings.yourFirstName')}
              value={household?.personAName || ''}
              onChange={(e) => handleUpdate({ personAName: e.target.value, name: household?.personBName ? `${e.target.value} & ${household.personBName}` : e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('settings.yourColor')}</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleUpdate({ personAColor: c })}
                    className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                      household?.personAColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={t('settings.colorLabel', { color: c })}
                  />
                ))}
              </div>
            </div>
            {household?.configModel !== 'solo' && (
              <>
                <Input
                  label={t('settings.partnerFirstName')}
                  value={household?.personBName || ''}
                  onChange={(e) => handleUpdate({ personBName: e.target.value, name: `${household.personAName} & ${e.target.value}` })}
                />
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{t('settings.partnerColor')}</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleUpdate({ personBColor: c })}
                        className={`w-8 h-8 rounded-full transition-all cursor-pointer ${
                          household?.personBColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={t('settings.colorLabel', { color: c })}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {t('settings.shareOf', { name: household?.personAName, percent: Math.round((household?.splitRatio || 0.5) * 100) })}
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
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.data')}</h2>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.fixedCharges')}</span>
            <span>{chargesStore.fixedCharges.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.installmentPayments')}</span>
            <span>{chargesStore.installmentPayments.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.plannedExpenses')}</span>
            <span>{chargesStore.plannedExpenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.savingsGoals')}</span>
            <span>{savingsStore.goals.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.quickExpenses')}</span>
            <span>{expenseStore.expenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.monthsEntered')}</span>
            <span>{Object.keys(monthlyStore.entries).length}</span>
          </div>
        </div>
      </Card>

      </div>
      </div>

      {/* Export / Import */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Button variant="secondary" onClick={handleExport} className="w-full">
          <Download size={14} className="inline mr-1.5" /> {t('settings.export')}
        </Button>
        <div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
            <Upload size={14} className="inline mr-1.5" /> {t('settings.restore')}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">
          <Tag size={12} className="inline mr-1.5" /> {t('settings.categories')}
        </h2>
        <Card>
          <div className="space-y-3">
            {Object.entries(categories).map(([key, cat]) => {
              const label = t(`categories.${key}`, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) })
              return (
                <div key={key} className="flex items-center gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategoryColor(key, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-white/10" style={{ backgroundColor: cat.color }} />
                  </label>
                  <span className="flex-1 text-sm">{label}</span>
                  <button
                    onClick={() => removeCategory(key)}
                    className="p-1 text-text-muted hover:text-danger transition-colors"
                    aria-label={t('common.delete')}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            })}

            {/* Add custom category */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/20" style={{ backgroundColor: newCategoryColor }} />
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('settings.newCategoryPlaceholder')}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
              />
              <button
                onClick={() => {
                  const key = newCategoryName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
                  if (key && !categories[key]) {
                    addCategory(key, newCategoryColor)
                    setNewCategoryName('')
                    setNewCategoryColor('#94A3B8')
                    toast.success(t('settings.categoryAdded'))
                  }
                }}
                disabled={!newCategoryName.trim()}
                className="p-1.5 rounded-lg bg-brand/10 text-brand disabled:opacity-30 transition-colors"
                aria-label={t('common.add')}
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={() => { resetCategories(); toast.success(t('settings.categoriesReset')) }}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              <RotateCcw size={12} /> {t('settings.resetCategories')}
            </button>
          </div>
        </Card>
      </div>

      {/* Logout */}
      {session && (
        <Button variant="secondary" onClick={handleLogout} className="w-full">
          <LogOut size={14} className="inline mr-1.5" /> {t('settings.logout')}
        </Button>
      )}

      {/* Reset */}
      <div className="pt-4 border-t border-white/[0.06]">
        {!confirmReset ? (
          <Button variant="danger" onClick={() => setConfirmReset(true)} className="w-full">
            <Trash2 size={14} className="inline mr-1.5" /> {t('settings.resetApp')}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-danger text-center">
              {t('settings.resetWarning')}
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmReset(false)} className="flex-1">{t('common.cancel')}</Button>
              <Button variant="danger" onClick={handleReset} className="flex-1">{t('common.confirm')}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
