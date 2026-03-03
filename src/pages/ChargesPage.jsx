import { useState } from 'react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { formatCurrency, CATEGORIES, FREQUENCIES, PAYER_OPTIONS } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3 } from 'lucide-react'

function ChargeForm({ initialValues, onSubmit, onCancel, household }) {
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      amount: '',
      payer: 'common',
      frequency: 'monthly',
      dayOfMonth: 1,
      category: 'autre',
      paymentDelayMonths: 0,
    }
  )

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <Input
        label="Nom"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="Ex: Prêt maison"
      />
      <Input
        label="Montant"
        type="number"
        value={form.amount}
        onChange={(e) => update('amount', e.target.value)}
        placeholder="0"
        suffix="€"
      />
      <Select
        label="Qui paie ?"
        value={form.payer}
        onChange={(e) => update('payer', e.target.value)}
        options={PAYER_OPTIONS(household)}
      />
      <Select
        label="Fréquence"
        value={form.frequency}
        onChange={(e) => update('frequency', e.target.value)}
        options={FREQUENCIES}
      />
      <Input
        label="Jour du mois"
        type="number"
        min="1"
        max="31"
        value={form.dayOfMonth}
        onChange={(e) => update('dayOfMonth', parseInt(e.target.value) || 1)}
      />
      <Select
        label="Catégorie"
        value={form.category}
        onChange={(e) => update('category', e.target.value)}
        options={CATEGORIES}
      />
      <Input
        label="Décalage prélèvement (mois)"
        type="number"
        min="0"
        value={form.paymentDelayMonths}
        onChange={(e) => update('paymentDelayMonths', parseInt(e.target.value) || 0)}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button
          onClick={() =>
            onSubmit({ ...form, amount: parseFloat(form.amount) || 0 })
          }
          disabled={!form.name.trim() || !form.amount}
          className="flex-1"
        >
          {initialValues ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}

function InstallmentForm({ initialValues, onSubmit, onCancel, household }) {
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      totalAmount: '',
      installmentCount: 3,
      installmentAmount: '',
      firstPaymentDate: '',
      payer: 'common',
    }
  )

  const update = (field, value) => {
    const next = { ...form, [field]: value }
    // Auto-calculate installment amount
    if (field === 'totalAmount' || field === 'installmentCount') {
      const total = field === 'totalAmount' ? parseFloat(value) : parseFloat(form.totalAmount)
      const count = field === 'installmentCount' ? parseInt(value) : form.installmentCount
      if (total && count) {
        next.installmentAmount = Math.round((total / count) * 100) / 100
      }
    }
    setForm(next)
  }

  return (
    <div className="space-y-4">
      <Input
        label="Nom"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="Ex: Tennis Abel"
      />
      <Input
        label="Montant total"
        type="number"
        value={form.totalAmount}
        onChange={(e) => update('totalAmount', e.target.value)}
        suffix="€"
      />
      <Input
        label="Nombre de versements"
        type="number"
        min="2"
        value={form.installmentCount}
        onChange={(e) => update('installmentCount', parseInt(e.target.value) || 2)}
      />
      <Input
        label="Montant par versement"
        type="number"
        value={form.installmentAmount}
        onChange={(e) => update('installmentAmount', e.target.value)}
        suffix="€"
      />
      <Input
        label="Date du 1er versement"
        type="date"
        value={form.firstPaymentDate}
        onChange={(e) => update('firstPaymentDate', e.target.value)}
      />
      <Select
        label="Qui paie ?"
        value={form.payer}
        onChange={(e) => update('payer', e.target.value)}
        options={PAYER_OPTIONS(household)}
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              ...form,
              totalAmount: parseFloat(form.totalAmount) || 0,
              installmentAmount: parseFloat(form.installmentAmount) || 0,
              installmentCount: parseInt(form.installmentCount) || 2,
            })
          }
          disabled={!form.name.trim() || !form.totalAmount || !form.firstPaymentDate}
          className="flex-1"
        >
          {initialValues ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}

function PlannedExpenseForm({ initialValues, onSubmit, onCancel, household }) {
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      estimatedAmount: '',
      targetMonth: '',
      payer: 'common',
      note: '',
    }
  )

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <Input
        label="Nom"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="Ex: Vacances Thaïlande"
      />
      <Input
        label="Montant estimé"
        type="number"
        value={form.estimatedAmount}
        onChange={(e) => update('estimatedAmount', e.target.value)}
        suffix="€"
      />
      <Input
        label="Mois cible"
        type="month"
        value={form.targetMonth}
        onChange={(e) => update('targetMonth', e.target.value)}
      />
      <Select
        label="Qui paie ?"
        value={form.payer}
        onChange={(e) => update('payer', e.target.value)}
        options={PAYER_OPTIONS(household)}
      />
      <Input
        label="Note"
        value={form.note}
        onChange={(e) => update('note', e.target.value)}
        placeholder="Détails optionnels..."
      />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button
          onClick={() =>
            onSubmit({
              ...form,
              estimatedAmount: parseFloat(form.estimatedAmount) || 0,
            })
          }
          disabled={!form.name.trim() || !form.estimatedAmount || !form.targetMonth}
          className="flex-1"
        >
          {initialValues ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}

export default function ChargesPage() {
  const household = useHouseholdStore((s) => s.household)
  const {
    fixedCharges,
    installmentPayments,
    plannedExpenses,
    addFixedCharge,
    updateFixedCharge,
    removeFixedCharge,
    toggleFixedCharge,
    addInstallment,
    updateInstallment,
    removeInstallment,
    addPlannedExpense,
    updatePlannedExpense,
    removePlannedExpense,
  } = useChargesStore()

  const [modal, setModal] = useState(null) // { type, editId? }
  const [tab, setTab] = useState('fixed')

  const tabs = [
    { id: 'fixed', label: 'Fixes', count: fixedCharges.length },
    { id: 'installment', label: 'Étalées', count: installmentPayments.length },
    { id: 'planned', label: 'Prévues', count: plannedExpenses.length },
  ]

  const getPayerLabel = (payer) => {
    if (payer === 'person_a') return household?.personAName || 'A'
    if (payer === 'person_b') return household?.personBName || 'B'
    return 'Commun'
  }

  const getPayerColor = (payer) => {
    if (payer === 'person_a') return household?.personAColor
    if (payer === 'person_b') return household?.personBColor
    return '#64748b'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Charges</h1>
        <Button size="sm" onClick={() => setModal({ type: tab })}>
          <Plus size={16} className="inline mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-brand text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Fixed charges list */}
      {tab === 'fixed' && (
        <div className="space-y-2">
          {fixedCharges.length === 0 && (
            <Card>
              <p className="text-center text-slate-500 py-4">
                Aucune charge fixe. Ajoutez-en une ou importez un CSV.
              </p>
            </Card>
          )}
          {fixedCharges.map((charge) => (
            <Card
              key={charge.id}
              className={`${!charge.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPayerColor(charge.payer) }} />
                    <span className="font-medium">{charge.name}</span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {formatCurrency(charge.amount)} · {getPayerLabel(charge.payer)} ·{' '}
                    {FREQUENCIES.find((f) => f.value === charge.frequency)?.label}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFixedCharge(charge.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    {charge.active ? <ToggleRight size={20} className="text-green-400" /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => setModal({ type: 'fixed', editId: charge.id })}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => removeFixedCharge(charge.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Installment payments list */}
      {tab === 'installment' && (
        <div className="space-y-2">
          {installmentPayments.length === 0 && (
            <Card>
              <p className="text-center text-slate-500 py-4">
                Aucun paiement étalé.
              </p>
            </Card>
          )}
          {installmentPayments.map((payment) => (
            <Card key={payment.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPayerColor(payment.payer) }} />
                    <span className="font-medium">{payment.name}</span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {formatCurrency(payment.totalAmount)} en {payment.installmentCount}x{' '}
                    ({formatCurrency(payment.installmentAmount)}/mois) · {getPayerLabel(payment.payer)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal({ type: 'installment', editId: payment.id })}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => removeInstallment(payment.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Planned expenses list */}
      {tab === 'planned' && (
        <div className="space-y-2">
          {plannedExpenses.length === 0 && (
            <Card>
              <p className="text-center text-slate-500 py-4">
                Aucune dépense planifiée.
              </p>
            </Card>
          )}
          {plannedExpenses.map((expense) => (
            <Card key={expense.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPayerColor(expense.payer) }} />
                    <span className="font-medium">{expense.name}</span>
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    ~{formatCurrency(expense.estimatedAmount)} · {expense.targetMonth} ·{' '}
                    {getPayerLabel(expense.payer)}
                  </div>
                  {expense.note && (
                    <div className="text-xs text-slate-500 mt-1">{expense.note}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal({ type: 'planned', editId: expense.id })}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => removePlannedExpense(expense.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={modal?.type === 'fixed'}
        onClose={() => setModal(null)}
        title={modal?.editId ? 'Modifier la charge' : 'Nouvelle charge fixe'}
      >
        <ChargeForm
          initialValues={
            modal?.editId
              ? fixedCharges.find((c) => c.id === modal.editId)
              : undefined
          }
          onSubmit={(data) => {
            if (modal?.editId) {
              updateFixedCharge(modal.editId, data)
            } else {
              addFixedCharge(data)
            }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>

      <Modal
        isOpen={modal?.type === 'installment'}
        onClose={() => setModal(null)}
        title={modal?.editId ? 'Modifier l\'échéancier' : 'Nouveau paiement étalé'}
      >
        <InstallmentForm
          initialValues={
            modal?.editId
              ? installmentPayments.find((p) => p.id === modal.editId)
              : undefined
          }
          onSubmit={(data) => {
            if (modal?.editId) {
              updateInstallment(modal.editId, data)
            } else {
              addInstallment(data)
            }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>

      <Modal
        isOpen={modal?.type === 'planned'}
        onClose={() => setModal(null)}
        title={modal?.editId ? 'Modifier la dépense' : 'Nouvelle dépense planifiée'}
      >
        <PlannedExpenseForm
          initialValues={
            modal?.editId
              ? plannedExpenses.find((e) => e.id === modal.editId)
              : undefined
          }
          onSubmit={(data) => {
            if (modal?.editId) {
              updatePlannedExpense(modal.editId, data)
            } else {
              addPlannedExpense(data)
            }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>
    </div>
  )
}
