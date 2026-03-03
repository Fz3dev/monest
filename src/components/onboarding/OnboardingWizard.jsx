import { useState } from 'react'
import { useHouseholdStore } from '../../stores/householdStore'
import Button from '../ui/Button'
import Input from '../ui/Input'

const CONFIG_MODELS = [
  {
    value: 'common_and_personal',
    label: 'Commun + Perso',
    description: 'Un compte commun et des comptes personnels',
  },
  {
    value: 'full_common',
    label: 'Tout commun',
    description: 'Un seul compte partagé',
  },
  {
    value: 'full_personal',
    label: 'Tout perso',
    description: 'Uniquement des comptes personnels',
  },
  {
    value: 'solo',
    label: 'Solo',
    description: 'Utilisation individuelle',
  },
]

const COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#f59e0b', label: 'Ambre' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#22c55e', label: 'Vert' },
]

export default function OnboardingWizard() {
  const setHousehold = useHouseholdStore((s) => s.setHousehold)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    personAName: '',
    personAColor: '#6366f1',
    personBName: '',
    personBColor: '#ec4899',
    configModel: 'common_and_personal',
    splitRatio: 0.5,
    splitMode: '50/50',
  })

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleFinish = () => {
    const household = {
      id: crypto.randomUUID(),
      name: form.personBName
        ? `${form.personAName} & ${form.personBName}`
        : form.personAName,
      personAName: form.personAName,
      personAColor: form.personAColor,
      personBName: form.configModel === 'solo' ? '' : form.personBName,
      personBColor: form.personBColor,
      configModel: form.configModel,
      splitRatio: form.splitRatio,
    }
    setHousehold(household)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">PayMe</h1>
          <p className="text-slate-400">Configurez votre budget</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-brand' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Qui êtes-vous ?</h2>
            <Input
              label="Votre prénom"
              value={form.personAName}
              onChange={(e) => update('personAName', e.target.value)}
              placeholder="Ex: Fawsy"
              autoFocus
            />
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Votre couleur</label>
              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => update('personAColor', c.value)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      form.personAColor === c.value
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!form.personAName.trim()}
              className="w-full"
              size="lg"
            >
              Continuer
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Modèle de comptes</h2>
            <div className="space-y-3">
              {CONFIG_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => {
                    update('configModel', model.value)
                    if (model.value === 'solo') {
                      update('personBName', '')
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    form.configModel === model.value
                      ? 'border-brand bg-brand/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="font-medium">{model.label}</div>
                  <div className="text-sm text-slate-400">{model.description}</div>
                </button>
              ))}
            </div>

            {form.configModel !== 'solo' && (
              <>
                <Input
                  label="Prénom du/de la partenaire"
                  value={form.personBName}
                  onChange={(e) => update('personBName', e.target.value)}
                  placeholder="Ex: Carla"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Sa couleur
                  </label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => update('personBColor', c.value)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          form.personBColor === c.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={form.configModel !== 'solo' && !form.personBName.trim()}
                className="flex-1"
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Répartition des charges</h2>

            {form.configModel === 'solo' ? (
              <p className="text-slate-400">
                En mode solo, toutes les charges vous sont attribuées.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {['50/50', 'custom', 'prorata'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        update('splitMode', mode)
                        if (mode === '50/50') update('splitRatio', 0.5)
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${
                        form.splitMode === mode
                          ? 'border-brand bg-brand/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      {mode === '50/50' && (
                        <>
                          <div className="font-medium">50/50</div>
                          <div className="text-sm text-slate-400">Partage égal</div>
                        </>
                      )}
                      {mode === 'custom' && (
                        <>
                          <div className="font-medium">Pourcentage personnalisé</div>
                          <div className="text-sm text-slate-400">
                            Ex: 60/40, 70/30...
                          </div>
                        </>
                      )}
                      {mode === 'prorata' && (
                        <>
                          <div className="font-medium">Au prorata des salaires</div>
                          <div className="text-sm text-slate-400">
                            Calculé automatiquement chaque mois
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>

                {form.splitMode === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Part de {form.personAName || 'Personne A'} : {Math.round(form.splitRatio * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={form.splitRatio * 100}
                      onChange={(e) => update('splitRatio', parseInt(e.target.value) / 100)}
                      className="w-full accent-brand"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-1">
                      <span>{form.personAName}: {Math.round(form.splitRatio * 100)}%</span>
                      <span>{form.personBName}: {Math.round((1 - form.splitRatio) * 100)}%</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">
                Retour
              </Button>
              <Button onClick={handleFinish} className="flex-1" size="lg">
                Commencer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
