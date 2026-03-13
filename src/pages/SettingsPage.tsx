import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import type { Session } from '@supabase/supabase-js'
import { CONFIG_MODEL } from '../types'
import type { Household, ConfigModel, SplitMode } from '../types'
import { useHouseholdStore, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../stores/householdStore'
import { useCategoriesStore } from '../stores/categoriesStore'
import { useChargesStore } from '../stores/chargesStore'
import { useMonthlyStore } from '../stores/monthlyStore'
import { useSavingsStore } from '../stores/savingsStore'
import { useExpenseStore } from '../stores/expenseStore'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { Download, Upload, Trash2, User, Database, LogOut, Users, Share2, Copy, Check, Loader2, UserPlus, Tag, Plus, X, RotateCcw, Bell, Sun, Moon, Monitor, ChevronRight, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useUiStore } from '../stores/uiStore'
import {
  isNotificationSupported,
  isNotificationEnabled,
  disableNotifications,
  requestPermission,
  registerPeriodicSync,
} from '../utils/notifications'
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/pushSubscription'

const COLORS = [
  '#6C63FF', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#22c55e',
]

interface SettingsPageProps {
  session?: Session | null
  saveHousehold?: (household: Household) => void | Promise<void>
  createInvite?: () => Promise<string | null>
}

export default function SettingsPage({ session, saveHousehold, createInvite }: SettingsPageProps) {
  const { t } = useTranslation()
  const household = useHouseholdStore((s) => s.household)
  const updateHousehold = useHouseholdStore((s) => s.updateHousehold)
  const resetHousehold = useHouseholdStore((s) => s.resetHousehold)
  const categories = useCategoriesStore((s) => s.categories)
  const updateCategoryColor = useCategoriesStore((s) => s.updateCategoryColor)
  const addCategory = useCategoriesStore((s) => s.addCategory)
  const removeCategory = useCategoriesStore((s) => s.removeCategory)
  const resetCategories = useCategoriesStore((s) => s.resetCategories)
  const fixedCharges = useChargesStore((s) => s.fixedCharges)
  const installmentPayments = useChargesStore((s) => s.installmentPayments)
  const plannedExpenses = useChargesStore((s) => s.plannedExpenses)
  const monthlyEntries = useMonthlyStore((s) => s.entries)
  const savingsGoals = useSavingsStore((s) => s.goals)
  const settingsExpenses = useExpenseStore((s) => s.expenses)
  const confidentialMode = useUiStore((s) => s.confidentialMode)
  const toggleConfidentialMode = useUiStore((s) => s.toggleConfidentialMode)
  const [confirmReset, setConfirmReset] = useState(false)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#94A3B8')
  const [coupleSetup, setCoupleSetup] = useState(false)
  const [coupleForm, setCoupleForm] = useState<{
    personBName: string
    personBColor: string
    configModel: ConfigModel
    splitRatio: number
    splitMode: SplitMode
  }>({
    personBName: '',
    personBColor: '#ec4899',
    configModel: 'common_and_personal',
    splitRatio: 0.5,
    splitMode: '50/50',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notificationsOn, setNotificationsOn] = useState(() => isNotificationEnabled())
  const [notifWeekly, setNotifWeekly] = useState(() => localStorage.getItem('monest-notif-weekly') !== 'false')
  const [notifEngagement, setNotifEngagement] = useState(() => localStorage.getItem('monest-notif-engagement') !== 'false')
  const [notifBudgetAlert, setNotifBudgetAlert] = useState(() => localStorage.getItem('monest-notif-budget-alert') !== 'false')
  const [notifPartnerExpense, setNotifPartnerExpense] = useState(() => localStorage.getItem('monest-notif-partner-expense') !== 'false')
  const [notifPartnerCharge, setNotifPartnerCharge] = useState(() => localStorage.getItem('monest-notif-partner-charge') !== 'false')
  const [notifMonthlySummary, setNotifMonthlySummary] = useState(() => localStorage.getItem('monest-notif-monthly-summary') !== 'false')
  const [notifModalOpen, setNotifModalOpen] = useState(false)

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('monest-theme') || 'dark')
  const applyTheme = (value: string) => {
    setTheme(value)
    localStorage.setItem('monest-theme', value)
    const root = document.documentElement
    if (value === 'light') {
      root.classList.add('light')
    } else if (value === 'dark') {
      root.classList.remove('light')
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('light', !prefersDark)
    }
  }

  const handleToggleNotifications = async () => {
    if (notificationsOn) {
      disableNotifications()
      setNotificationsOn(false)
      toast.success(t('notifications.disabled'))
      // Unsubscribe from push
      if (isPushSupported() && session?.user) {
        unsubscribeFromPush(session.user.id).catch(() => {})
      }
    } else {
      if (!isNotificationSupported()) return
      if (Notification.permission === 'denied') {
        toast.error(t('notifications.permissionDenied'))
        return
      }
      const granted = await requestPermission()
      if (granted) {
        setNotificationsOn(true)
        toast.success(t('notifications.enabled'))
        await registerPeriodicSync()
        // Subscribe to push
        if (isPushSupported() && session?.user) {
          subscribeToPush(session.user.id).catch(() => {})
        }
      } else {
        toast.error(t('notifications.permissionDenied'))
      }
    }
  }

  const handleExport = () => {
    const data = {
      household,
      fixedCharges: fixedCharges,
      installmentPayments: installmentPayments,
      plannedExpenses: plannedExpenses,
      monthlyEntries: monthlyEntries,
      savingsGoals: savingsGoals,
      expenses: settingsExpenses,
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Basic validation of imported data
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        toast.error(t('settings.invalidFile'))
        e.target.value = ''
        return
      }
      if (data.household) {
        const h = data.household
        if (typeof h !== 'object' || h === null) {
          toast.error(t('settings.invalidFile'))
          e.target.value = ''
          return
        }
        if (('personAName' in h && typeof h.personAName !== 'string') ||
            ('splitRatio' in h && typeof h.splitRatio !== 'number') ||
            ('configModel' in h && typeof h.configModel !== 'string')) {
          toast.error(t('settings.invalidFile'))
          e.target.value = ''
          return
        }
      }
      if (data.fixedCharges && !Array.isArray(data.fixedCharges)) {
        toast.error(t('settings.invalidFile'))
        e.target.value = ''
        return
      }
      if (data.expenses && !Array.isArray(data.expenses)) {
        toast.error(t('settings.invalidFile'))
        e.target.value = ''
        return
      }
      if (data.savingsGoals && !Array.isArray(data.savingsGoals)) {
        toast.error(t('settings.invalidFile'))
        e.target.value = ''
        return
      }

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
      await supabase!.auth.signOut()
    }
    localStorage.clear()
    // Clear IndexedDB to prevent stale data from previous user
    try {
      const dbs = await indexedDB.databases()
      dbs.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name) })
    } catch { /* IndexedDB cleanup is best-effort */ }
    resetHousehold()
    window.location.reload()
  }

  const handleUpdate = (updates: Partial<Household>) => {
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
      name: `${household?.personAName} & ${coupleForm.personBName}`,
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
      // navigator.clipboard.writeText fails on some mobile browsers
      // fallback to execCommand('copy') with a temporary textarea
      let copied = false
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url)
          copied = true
        } catch { /* fallback below */ }
      }
      if (!copied) {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
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
        <img src="/logo-crown-sm.webp" alt="Monest" className="w-7 h-7 lg:hidden" />
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
                  {([
                    { value: CONFIG_MODEL.CommonAndPersonal, label: t('settings.modelLabels.common_and_personal') },
                    { value: CONFIG_MODEL.FullCommon, label: t('settings.modelLabels.full_common') },
                    { value: CONFIG_MODEL.FullPersonal, label: t('settings.modelLabels.full_personal') },
                  ]).map((m) => (
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
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">{t('settings.currency')}</span>
              <span>{SUPPORTED_CURRENCIES.find((c) => c.value === (household?.currency || DEFAULT_CURRENCY))?.label || household?.currency || DEFAULT_CURRENCY}</span>
            </div>
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
                  onChange={(e) => handleUpdate({ personBName: e.target.value, name: `${household?.personAName} & ${e.target.value}` })}
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
            <Select
              label={t('settings.currency')}
              options={SUPPORTED_CURRENCIES}
              value={household?.currency || DEFAULT_CURRENCY}
              onChange={(e) => handleUpdate({ currency: e.target.value })}
            />
            <p className="text-xs text-text-muted -mt-1">{t('settings.currencyHint')}</p>
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
            <span>{fixedCharges.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.installmentPayments')}</span>
            <span>{installmentPayments.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.plannedExpenses')}</span>
            <span>{plannedExpenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.savingsGoals')}</span>
            <span>{savingsGoals.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.quickExpenses')}</span>
            <span>{settingsExpenses.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('settings.monthsEntered')}</span>
            <span>{Object.keys(monthlyEntries).length}</span>
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
                  <label className="relative cursor-pointer" aria-label={label}>
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => updateCategoryColor(key, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      aria-label={label}
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
              <label className="relative cursor-pointer" aria-label={t('settings.categoryColor')}>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  aria-label={t('settings.categoryColor')}
                />
                <div className="w-6 h-6 rounded-full border-2 border-dashed border-white/20" style={{ backgroundColor: newCategoryColor }} />
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('settings.newCategoryPlaceholder')}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-brand/50"
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

      {/* Theme */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Sun size={14} className="text-brand" />
          <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.theme')}</h2>
        </div>
        <div className="flex gap-2">
          {[
            { value: 'dark', label: t('settings.themeDark'), icon: Moon },
            { value: 'light', label: t('settings.themeLight'), icon: Sun },
            { value: 'system', label: t('settings.themeSystem'), icon: Monitor },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyTheme(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                theme === opt.value
                  ? 'bg-brand/15 text-brand border border-brand/30'
                  : 'bg-white/[0.04] text-text-muted border border-white/[0.08] hover:text-text-secondary'
              }`}
            >
              <opt.icon size={13} />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Confidential mode */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <EyeOff size={14} className="text-brand flex-shrink-0" />
            <div>
              <p className="text-sm text-text-primary">{t('settings.confidentialMode')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('settings.confidentialModeHint')}</p>
            </div>
          </div>
          <button
            onClick={toggleConfidentialMode}
            className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
              confidentialMode ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
            }`}
            role="switch"
            aria-checked={confidentialMode}
            aria-label={t('settings.confidentialMode')}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                confidentialMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      {isNotificationSupported() && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-brand" />
            <h2 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('settings.notifications')}</h2>
          </div>
          {/* Main toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">{t('notifications.mainToggle')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('notifications.mainToggleHint')}</p>
            </div>
            <button
              onClick={handleToggleNotifications}
              className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                notificationsOn ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
              }`}
              role="switch"
              aria-checked={notificationsOn}
              aria-label={t('notifications.mainToggle')}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  notificationsOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {/* Customize button */}
          {notificationsOn && (
            <button
              onClick={() => setNotifModalOpen(true)}
              className="mt-3 w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <span>{t('notifications.customize')}</span>
              <ChevronRight size={14} className="text-text-muted" />
            </button>
          )}
        </Card>
      )}

      {/* Notification preferences modal */}
      <Modal isOpen={notifModalOpen} onClose={() => setNotifModalOpen(false)} title={t('notifications.customizeTitle')}>
        <div className="space-y-5">
          {/* Section: Rappels */}
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('notifications.sectionReminders')}</p>
            <div className="space-y-4">
              {/* Weekly reminder */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{t('notifications.weeklyTitle')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('notifications.weeklyHint')}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !notifWeekly
                    setNotifWeekly(next)
                    localStorage.setItem('monest-notif-weekly', String(next))
                  }}
                  className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    notifWeekly ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                  }`}
                  role="switch"
                  aria-checked={notifWeekly}
                  aria-label={t('notifications.weeklyTitle')}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifWeekly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {/* Monthly summary */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{t('notifications.monthlySummaryTitle')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('notifications.monthlySummaryHint')}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !notifMonthlySummary
                    setNotifMonthlySummary(next)
                    localStorage.setItem('monest-notif-monthly-summary', String(next))
                  }}
                  className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    notifMonthlySummary ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                  }`}
                  role="switch"
                  aria-checked={notifMonthlySummary}
                  aria-label={t('notifications.monthlySummaryTitle')}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifMonthlySummary ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Alertes */}
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('notifications.sectionAlerts')}</p>
            <div className="space-y-4">
              {/* Budget alert */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{t('notifications.budgetAlertTitle')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('notifications.budgetAlertHint')}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !notifBudgetAlert
                    setNotifBudgetAlert(next)
                    localStorage.setItem('monest-notif-budget-alert', String(next))
                  }}
                  className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    notifBudgetAlert ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                  }`}
                  role="switch"
                  aria-checked={notifBudgetAlert}
                  aria-label={t('notifications.budgetAlertTitle')}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifBudgetAlert ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {/* Engagement alerts */}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">{t('notifications.engagementTitle')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('notifications.engagementHint')}</p>
                </div>
                <button
                  onClick={() => {
                    const next = !notifEngagement
                    setNotifEngagement(next)
                    localStorage.setItem('monest-notif-engagement', String(next))
                  }}
                  className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    notifEngagement ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                  }`}
                  role="switch"
                  aria-checked={notifEngagement}
                  aria-label={t('notifications.engagementTitle')}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      notifEngagement ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section: Activité partenaire (couple only) */}
          {household?.configModel !== 'solo' && (
            <div>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-3">{t('notifications.sectionPartner')}</p>
              <div className="space-y-4">
                {/* Partner expense */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{t('notifications.partnerExpenseTitle')}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t('notifications.partnerExpenseHint')}</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !notifPartnerExpense
                      setNotifPartnerExpense(next)
                      localStorage.setItem('monest-notif-partner-expense', String(next))
                    }}
                    className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      notifPartnerExpense ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                    }`}
                    role="switch"
                    aria-checked={notifPartnerExpense}
                    aria-label={t('notifications.partnerExpenseTitle')}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        notifPartnerExpense ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {/* Partner charge change */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">{t('notifications.partnerChargeTitle')}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t('notifications.partnerChargeHint')}</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !notifPartnerCharge
                      setNotifPartnerCharge(next)
                      localStorage.setItem('monest-notif-partner-charge', String(next))
                    }}
                    className={`relative ml-3 flex-shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      notifPartnerCharge ? 'bg-brand' : 'bg-white/[0.12] border border-black/[0.08]'
                    }`}
                    role="switch"
                    aria-checked={notifPartnerCharge}
                    aria-label={t('notifications.partnerChargeTitle')}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        notifPartnerCharge ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

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
