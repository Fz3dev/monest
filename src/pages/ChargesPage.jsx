import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useHouseholdStore } from '../stores/householdStore'
import { useChargesStore } from '../stores/chargesStore'
import { formatCurrency, CATEGORIES, FREQUENCIES, PAYER_OPTIONS } from '../utils/format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit3, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

function ChargeForm({ initialValues, onSubmit, onCancel, household }) {
  const payerOptions = PAYER_OPTIONS(household)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      amount: '',
      payer: payerOptions[0]?.value || 'common',
      frequency: 'monthly',
      startMonth: 1,
      dayOfMonth: 1,
      category: 'autre',
      paymentDelayMonths: 0,
    }
  )
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const showStartMonth = form.frequency !== 'monthly'

  return (
    <div className="space-y-4">
      <Input label="Nom" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Pret maison" />
      <Input label="Montant" type="number" value={form.amount} onChange={(e) => update('amount', e.target.value)} placeholder="0" suffix="€" />
      <Select label="Qui paie ?" value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <Select label="Frequence" value={form.frequency} onChange={(e) => update('frequency', e.target.value)} options={FREQUENCIES} />
      {showStartMonth && (
        <Input
          label="Mois de debut (1-12)"
          type="number"
          min="1"
          max="12"
          value={form.startMonth}
          onChange={(e) => update('startMonth', parseInt(e.target.value) || 1)}
        />
      )}
      <Input label="Jour du mois" type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => update('dayOfMonth', parseInt(e.target.value) || 1)} />
      <Select label="Categorie" value={form.category} onChange={(e) => update('category', e.target.value)} options={CATEGORIES} />
      <Input label="Decalage prelevement (mois)" type="number" min="0" value={form.paymentDelayMonths} onChange={(e) => update('paymentDelayMonths', parseInt(e.target.value) || 0)} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button onClick={() => onSubmit({ ...form, amount: parseFloat(form.amount) || 0 })} disabled={!form.name.trim() || !form.amount} className="flex-1">
          {initialValues ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}

function InstallmentForm({ initialValues, onSubmit, onCancel, household }) {
  const payerOptions = PAYER_OPTIONS(household)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      totalAmount: '',
      installmentCount: 3,
      installmentAmount: '',
      firstPaymentDate: '',
      payer: payerOptions[0]?.value || 'common',
    }
  )

  const update = (field, value) => {
    const next = { ...form, [field]: value }
    if (field === 'totalAmount' || field === 'installmentCount') {
      const total = field === 'totalAmount' ? parseFloat(value) : parseFloat(form.totalAmount)
      const count = field === 'installmentCount' ? parseInt(value) : form.installmentCount
      if (total && count) next.installmentAmount = Math.round((total / count) * 100) / 100
    }
    setForm(next)
  }

  return (
    <div className="space-y-4">
      <Input label="Nom" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Tennis Abel" />
      <Input label="Montant total" type="number" value={form.totalAmount} onChange={(e) => update('totalAmount', e.target.value)} suffix="€" />
      <Input label="Nombre de versements" type="number" min="2" value={form.installmentCount} onChange={(e) => update('installmentCount', parseInt(e.target.value) || 2)} />
      <Input label="Montant par versement" type="number" value={form.installmentAmount} onChange={(e) => update('installmentAmount', e.target.value)} suffix="€" />
      <Input label="Date du 1er versement" type="date" value={form.firstPaymentDate} onChange={(e) => update('firstPaymentDate', e.target.value)} />
      <Select label="Qui paie ?" value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button
          onClick={() => onSubmit({
            ...form,
            totalAmount: parseFloat(form.totalAmount) || 0,
            installmentAmount: parseFloat(form.installmentAmount) || 0,
            installmentCount: parseInt(form.installmentCount) || 2,
          })}
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
  const payerOptions = PAYER_OPTIONS(household)
  const [form, setForm] = useState(
    initialValues || {
      name: '',
      estimatedAmount: '',
      targetMonth: '',
      payer: payerOptions[0]?.value || 'common',
      note: '',
    }
  )
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  return (
    <div className="space-y-4">
      <Input label="Nom" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Ex: Vacances Thailande" />
      <Input label="Montant estime" type="number" value={form.estimatedAmount} onChange={(e) => update('estimatedAmount', e.target.value)} suffix="€" />
      <Input label="Mois cible" type="month" value={form.targetMonth} onChange={(e) => update('targetMonth', e.target.value)} />
      <Select label="Qui paie ?" value={form.payer} onChange={(e) => update('payer', e.target.value)} options={payerOptions} />
      <Input label="Note" value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Details optionnels..." />
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Annuler</Button>
        <Button
          onClick={() => onSubmit({ ...form, estimatedAmount: parseFloat(form.estimatedAmount) || 0 })}
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
    fixedCharges, installmentPayments, plannedExpenses,
    addFixedCharge, updateFixedCharge, removeFixedCharge, toggleFixedCharge,
    addInstallment, updateInstallment, removeInstallment,
    addPlannedExpense, updatePlannedExpense, removePlannedExpense,
  } = useChargesStore()

  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('fixed')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const tabs = [
    { id: 'fixed', label: 'Fixes', count: fixedCharges.length },
    { id: 'installment', label: 'Etalees', count: installmentPayments.length },
    { id: 'planned', label: 'Prevues', count: plannedExpenses.length },
  ]

  const getPayerLabel = (payer) => {
    if (payer === 'person_a') return household?.personAName || 'A'
    if (payer === 'person_b') return household?.personBName || 'B'
    return 'Commun'
  }

  const getPayerColor = (payer) => {
    if (payer === 'person_a') return household?.personAColor
    if (payer === 'person_b') return household?.personBColor
    return '#6C63FF'
  }

  const handleDelete = (type, id, name) => {
    if (deleteConfirm === id) {
      if (type === 'fixed') removeFixedCharge(id)
      else if (type === 'installment') removeInstallment(id)
      else removePlannedExpense(id)
      setDeleteConfirm(null)
      toast.success(`"${name}" supprime`)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <motion.h1
          className="text-2xl font-bold"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Charges
        </motion.h1>
        <Button size="sm" onClick={() => setModal({ type: tab })}>
          <Plus size={14} className="inline mr-1" /> Ajouter
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-surface/60 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === t.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-muted hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Fixed charges */}
      <AnimatePresence mode="wait">
        {tab === 'fixed' && (
          <motion.div key="fixed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {fixedCharges.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">Aucune charge fixe.</p></Card>
            )}
            {fixedCharges.map((charge) => (
              <Card key={charge.id} className={`${!charge.active ? 'opacity-40' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(charge.payer) }} />
                      <span className="font-medium text-sm truncate">{charge.name}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {formatCurrency(charge.amount)} · {getPayerLabel(charge.payer)} · {FREQUENCIES.find((f) => f.value === charge.frequency)?.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => toggleFixedCharge(charge.id)} className="text-text-muted hover:text-white p-2" aria-label={charge.active ? 'Desactiver' : 'Activer'}>
                      {charge.active ? <ToggleRight size={20} className="text-success" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => setModal({ type: 'fixed', editId: charge.id })} className="text-text-muted hover:text-white p-2" aria-label="Modifier">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete('fixed', charge.id, charge.name)} className={`p-1 transition-colors ${deleteConfirm === charge.id ? 'text-danger' : 'text-text-muted hover:text-danger'}`} aria-label="Supprimer">
                      {deleteConfirm === charge.id ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {tab === 'installment' && (
          <motion.div key="installment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {installmentPayments.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">Aucun paiement etale.</p></Card>
            )}
            {installmentPayments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(payment.payer) }} />
                      <span className="font-medium text-sm truncate">{payment.name}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {formatCurrency(payment.totalAmount)} en {payment.installmentCount}x ({formatCurrency(payment.installmentAmount)}/mois)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setModal({ type: 'installment', editId: payment.id })} className="text-text-muted hover:text-white p-2" aria-label="Modifier">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete('installment', payment.id, payment.name)} className={`p-1 transition-colors ${deleteConfirm === payment.id ? 'text-danger' : 'text-text-muted hover:text-danger'}`} aria-label="Supprimer">
                      {deleteConfirm === payment.id ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}

        {tab === 'planned' && (
          <motion.div key="planned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {plannedExpenses.length === 0 && (
              <Card><p className="text-center text-text-muted py-6 text-sm">Aucune depense planifiee.</p></Card>
            )}
            {plannedExpenses.map((expense) => (
              <Card key={expense.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getPayerColor(expense.payer) }} />
                      <span className="font-medium text-sm truncate">{expense.name}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      ~{formatCurrency(expense.estimatedAmount)} · {expense.targetMonth}
                    </div>
                    {expense.note && <div className="text-[10px] text-text-muted mt-0.5">{expense.note}</div>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setModal({ type: 'planned', editId: expense.id })} className="text-text-muted hover:text-white p-2" aria-label="Modifier">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete('planned', expense.id, expense.name)} className={`p-1 transition-colors ${deleteConfirm === expense.id ? 'text-danger' : 'text-text-muted hover:text-danger'}`} aria-label="Supprimer">
                      {deleteConfirm === expense.id ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={modal?.type === 'fixed'} onClose={() => setModal(null)} title={modal?.editId ? 'Modifier la charge' : 'Nouvelle charge fixe'}>
        <ChargeForm
          initialValues={modal?.editId ? fixedCharges.find((c) => c.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (modal?.editId) updateFixedCharge(modal.editId, data)
            else { addFixedCharge(data); toast.success(`"${data.name}" ajoutee`) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>

      <Modal isOpen={modal?.type === 'installment'} onClose={() => setModal(null)} title={modal?.editId ? "Modifier l'echeancier" : 'Nouveau paiement etale'}>
        <InstallmentForm
          initialValues={modal?.editId ? installmentPayments.find((p) => p.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (modal?.editId) updateInstallment(modal.editId, data)
            else { addInstallment(data); toast.success(`"${data.name}" ajoute`) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>

      <Modal isOpen={modal?.type === 'planned'} onClose={() => setModal(null)} title={modal?.editId ? 'Modifier la depense' : 'Nouvelle depense planifiee'}>
        <PlannedExpenseForm
          initialValues={modal?.editId ? plannedExpenses.find((e) => e.id === modal.editId) : undefined}
          onSubmit={(data) => {
            if (modal?.editId) updatePlannedExpense(modal.editId, data)
            else { addPlannedExpense(data); toast.success(`"${data.name}" ajoutee`) }
            setModal(null)
          }}
          onCancel={() => setModal(null)}
          household={household}
        />
      </Modal>
    </div>
  )
}
