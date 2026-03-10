import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../../stores/householdStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { User, Users } from 'lucide-react'

const COLORS = [
  { value: '#6C63FF', label: 'Indigo' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f59e0b', label: 'Ambre' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#22c55e', label: 'Vert' },
]

export default function OnboardingWizard({ onComplete }) {
  const { t } = useTranslation()
  const setHousehold = useHouseholdStore((s) => s.setHousehold)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    personAName: '',
    personAColor: '#6C63FF',
    usageMode: '',
    personBName: '',
    personBColor: '#ec4899',
    configModel: 'common_and_personal',
    splitRatio: 0.5,
    splitMode: '50/50',
  })

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const isSolo = form.usageMode === 'solo'
  const totalSteps = isSolo ? 2 : 3

  const handleFinish = async () => {
    const household = {
      id: crypto.randomUUID(),
      name: isSolo ? form.personAName : `${form.personAName} & ${form.personBName}`,
      personAName: form.personAName,
      personAColor: form.personAColor,
      personBName: isSolo ? '' : form.personBName,
      personBColor: form.personBColor,
      configModel: isSolo ? 'solo' : form.configModel,
      splitRatio: form.splitRatio,
      splitMode: form.splitMode,
    }
    setHousehold(household)
    if (onComplete) await onComplete(household)
  }

  const COUPLE_MODELS = [
    { value: 'common_and_personal', label: t('onboarding.models.common_and_personal'), description: t('onboarding.models.common_and_personal_desc') },
    { value: 'full_common', label: t('onboarding.models.full_common'), description: t('onboarding.models.full_common_desc') },
    { value: 'full_personal', label: t('onboarding.models.full_personal'), description: t('onboarding.models.full_personal_desc') },
  ]

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
            Monest
          </h1>
          <p className="text-text-secondary text-sm">{t('onboarding.setupBudget')}</p>
        </motion.div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <motion.div
              key={s}
              layout
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-brand' : 'bg-white/[0.08]'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: s * 0.1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Who are you? */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">{t('onboarding.whoAreYou')}</h2>
              <Input
                label={t('onboarding.yourFirstName')}
                value={form.personAName}
                onChange={(e) => update('personAName', e.target.value)}
                placeholder="Ex: Fawsy"
                autoFocus
              />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">{t('onboarding.yourColor')}</label>
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => update('personAColor', c.value)}
                      className={`w-10 h-10 rounded-full transition-all cursor-pointer ${
                        form.personAColor === c.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep(2)} disabled={!form.personAName.trim()} className="w-full" size="lg">
                {t('common.continue')}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Solo or Couple */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">{t('onboarding.usageMode')}</h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => update('usageMode', 'solo')}
                  className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                    form.usageMode === 'solo'
                      ? 'border-brand/50 bg-brand/10 ring-1 ring-brand/30'
                      : 'border-white/[0.06] bg-bg-surface/60 hover:border-white/[0.12]'
                  }`}
                >
                  <User size={24} className={`mb-3 ${form.usageMode === 'solo' ? 'text-brand' : 'text-text-muted'}`} />
                  <div className="font-semibold text-sm">{t('onboarding.soloTitle')}</div>
                  <div className="text-[11px] text-text-muted mt-1">{t('onboarding.soloDescription')}</div>
                </button>
                <button
                  onClick={() => update('usageMode', 'couple')}
                  className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                    form.usageMode === 'couple'
                      ? 'border-brand/50 bg-brand/10 ring-1 ring-brand/30'
                      : 'border-white/[0.06] bg-bg-surface/60 hover:border-white/[0.12]'
                  }`}
                >
                  <Users size={24} className={`mb-3 ${form.usageMode === 'couple' ? 'text-brand' : 'text-text-muted'}`} />
                  <div className="font-semibold text-sm">{t('onboarding.coupleTitle')}</div>
                  <div className="text-[11px] text-text-muted mt-1">{t('onboarding.coupleDescription')}</div>
                </button>
              </div>

              {/* Solo: small note + finish button */}
              <AnimatePresence>
                {form.usageMode === 'solo' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <p className="text-xs text-text-muted text-center">
                      {t('onboarding.addPartnerLater')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Couple: partner fields */}
              <AnimatePresence>
                {form.usageMode === 'couple' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <Input
                      label={t('onboarding.partnerFirstName')}
                      value={form.personBName}
                      onChange={(e) => update('personBName', e.target.value)}
                      placeholder="Ex: Carla"
                    />
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-2">{t('onboarding.partnerColor')}</label>
                      <div className="flex gap-3">
                        {COLORS.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => update('personBColor', c.value)}
                            className={`w-10 h-10 rounded-full transition-all cursor-pointer ${
                              form.personBColor === c.value
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110'
                                : 'hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.value }}
                            aria-label={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">{t('common.back')}</Button>
                {form.usageMode === 'solo' ? (
                  <Button onClick={handleFinish} className="flex-1" size="lg" disabled={!form.usageMode}>
                    {t('onboarding.start')}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1"
                    disabled={!form.usageMode || (form.usageMode === 'couple' && !form.personBName.trim())}
                  >
                    {t('common.continue')}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Model + Distribution (couple only) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold">{t('onboarding.householdConfig')}</h2>

              {/* Account model */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">{t('onboarding.accountModel')}</label>
                <div className="space-y-2">
                  {COUPLE_MODELS.map((model) => (
                    <button
                      key={model.value}
                      onClick={() => update('configModel', model.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        form.configModel === model.value
                          ? 'border-brand/50 bg-brand/10'
                          : 'border-white/[0.06] bg-bg-surface/60 hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="font-medium text-sm">{model.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Distribution */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">{t('onboarding.chargeDistribution')}</label>
                <div className="space-y-2">
                  {['50/50', 'custom', 'prorata'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        update('splitMode', mode)
                        if (mode === '50/50') update('splitRatio', 0.5)
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                        form.splitMode === mode
                          ? 'border-brand/50 bg-brand/10'
                          : 'border-white/[0.06] bg-bg-surface/60 hover:border-white/[0.12]'
                      }`}
                    >
                      {mode === '50/50' && <><div className="font-medium text-sm">50/50</div><div className="text-xs text-text-muted mt-0.5">{t('onboarding.equalSplit')}</div></>}
                      {mode === 'custom' && <><div className="font-medium text-sm">{t('onboarding.customPercentage')}</div><div className="text-xs text-text-muted mt-0.5">{t('onboarding.customExample')}</div></>}
                      {mode === 'prorata' && <><div className="font-medium text-sm">{t('onboarding.prorata')}</div><div className="text-xs text-text-muted mt-0.5">{t('onboarding.prorataDescription')}</div></>}
                    </button>
                  ))}
                </div>
              </div>

              {form.splitMode === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">
                    {t('onboarding.shareOf', { name: form.personAName || t('common.personA'), percent: Math.round(form.splitRatio * 100) })}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.splitRatio * 100}
                    onChange={(e) => update('splitRatio', parseInt(e.target.value) / 100)}
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{form.personAName}: {Math.round(form.splitRatio * 100)}%</span>
                    <span>{form.personBName}: {Math.round((1 - form.splitRatio) * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">{t('common.back')}</Button>
                <Button onClick={handleFinish} className="flex-1" size="lg">{t('onboarding.start')}</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
