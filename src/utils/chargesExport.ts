import { getCategoryLabel, getFrequencyLabel } from './format'
import type { FixedCharge, InstallmentPayment, PlannedExpense, Household, Payer } from '../types'
import type { TFunction } from 'i18next'

export type ExportFormat = 'csv' | 'pdf'
export type ChargeTypeFilter = 'fixed' | 'installment' | 'planned'

interface ExportOptions {
  format: ExportFormat
  chargeTypes: ChargeTypeFilter[]
  payers: Payer[]
  fixedCharges: FixedCharge[]
  installmentPayments: InstallmentPayment[]
  plannedExpenses: PlannedExpense[]
  household: Household | null
  t: TFunction
  currency?: string
}

function getPayerLabel(payer: Payer, household: Household | null, t: TFunction): string {
  if (payer === 'common') return t('payer.common')
  if (payer === 'person_a') return household?.personAName || t('common.personA')
  if (payer === 'person_b') return household?.personBName || t('common.personB')
  return payer
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function dateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

function buildRows(opts: ExportOptions): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  const { chargeTypes, payers, fixedCharges, installmentPayments, plannedExpenses, household, t } = opts

  if (chargeTypes.includes('fixed')) {
    for (const c of fixedCharges) {
      if (!payers.includes(c.payer)) continue
      if (!c.active) continue
      rows.push({
        [t('export.colType')]: t('charges.fixedTab'),
        [t('export.colName')]: c.name,
        [t('export.colAmount')]: formatAmount(c.amount),
        [t('export.colFrequency')]: getFrequencyLabel(c.frequency),
        [t('export.colCategory')]: getCategoryLabel(c.category),
        [t('export.colPayer')]: getPayerLabel(c.payer, household, t),
      })
    }
  }

  if (chargeTypes.includes('installment')) {
    for (const c of installmentPayments) {
      if (!payers.includes(c.payer)) continue
      rows.push({
        [t('export.colType')]: t('charges.installmentTab'),
        [t('export.colName')]: c.name,
        [t('export.colAmount')]: formatAmount(c.installmentAmount),
        [t('export.colFrequency')]: `${c.installmentCount}x`,
        [t('export.colCategory')]: '-',
        [t('export.colPayer')]: getPayerLabel(c.payer, household, t),
      })
    }
  }

  if (chargeTypes.includes('planned')) {
    for (const c of plannedExpenses) {
      if (!payers.includes(c.payer)) continue
      rows.push({
        [t('export.colType')]: t('charges.plannedTab'),
        [t('export.colName')]: c.name,
        [t('export.colAmount')]: formatAmount(c.estimatedAmount),
        [t('export.colFrequency')]: c.targetMonth,
        [t('export.colCategory')]: '-',
        [t('export.colPayer')]: getPayerLabel(c.payer, household, t),
      })
    }
  }

  return rows
}

export async function exportCSV(opts: ExportOptions): Promise<void> {
  const rows = buildRows(opts)
  if (!rows.length) return

  const Papa = (await import('papaparse')).default
  const csv = Papa.unparse(rows, { delimiter: ';' })
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `monest-charges-${dateStr()}.csv`)
}

// ─── PDF Export ─────────────────────────────────────────────────────────────

async function loadLogoBase64(): Promise<string> {
  const response = await fetch('/logo-full.png')
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

export async function exportPDF(opts: ExportOptions): Promise<void> {
  const { chargeTypes, payers, fixedCharges, installmentPayments, plannedExpenses, household, t } = opts
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const BRAND = [108, 99, 255] as const
  const DARK_BG = [11, 11, 15] as const
  const CARD_BG = [22, 22, 30] as const
  const TEXT = [255, 255, 255] as const
  const TEXT_MUTED = [160, 160, 180] as const
  const pageW = doc.internal.pageSize.getWidth()

  // Background
  doc.setFillColor(...DARK_BG)
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F')

  // Header bar
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageW, 28, 'F')

  // Logo
  try {
    const logoData = await loadLogoBase64()
    doc.addImage(logoData, 'PNG', 14, 6, 40, 16)
  } catch {
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Monest', 14, 18)
  }

  // Export date
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(dateStr(), pageW - 14, 12, { align: 'right' })

  // Household name
  if (household?.name) {
    doc.setFontSize(10)
    doc.text(household.name, pageW - 14, 18, { align: 'right' })
  }

  let yPos = 36

  // Subtitle
  doc.setTextColor(...TEXT)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdfTitle'), 14, yPos)
  yPos += 4

  // Payer filter info
  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(8)
  const payerLabels = payers.map((p) => getPayerLabel(p, household, t))
  doc.text(`${t('export.pdfPayerFilter')}: ${payerLabels.join(', ')}`, 14, yPos + 4)
  yPos += 12

  // Helper to add a section
  const addSection = (title: string, data: string[][]) => {
    if (!data.length) return

    // Check if we need a new page (minimum 40mm needed for header + at least 1 row)
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      doc.setFillColor(...DARK_BG)
      doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F')
      yPos = 14
    }

    doc.setTextColor(...BRAND)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 14, yPos)
    yPos += 2

    autoTable(doc, {
      startY: yPos,
      head: [[
        t('export.colName'),
        t('export.colAmount'),
        t('export.colFrequency'),
        t('export.colCategory'),
        t('export.colPayer'),
      ]],
      body: data,
      theme: 'plain',
      styles: {
        fillColor: CARD_BG as [number, number, number],
        textColor: TEXT as [number, number, number],
        fontSize: 8,
        cellPadding: 3,
        lineColor: [40, 40, 50],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: BRAND as [number, number, number],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [18, 18, 24],
      },
      margin: { left: 14, right: 14 },
    })

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  // Fixed charges section
  if (chargeTypes.includes('fixed')) {
    const data = fixedCharges
      .filter((c) => payers.includes(c.payer) && c.active)
      .map((c) => [
        c.name,
        `${formatAmount(c.amount)} \u20AC`,
        getFrequencyLabel(c.frequency),
        getCategoryLabel(c.category),
        getPayerLabel(c.payer, household, t),
      ])
    const total = fixedCharges
      .filter((c) => payers.includes(c.payer) && c.active)
      .reduce((sum, c) => sum + c.amount, 0)
    if (data.length) {
      addSection(`${t('charges.fixedTab')} (${data.length})`, data)
      // Total row
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total : ${formatAmount(total)} \u20AC`, pageW - 14, yPos - 2, { align: 'right' })
    }
  }

  // Installment payments section
  if (chargeTypes.includes('installment')) {
    const data = installmentPayments
      .filter((c) => payers.includes(c.payer))
      .map((c) => [
        c.name,
        `${formatAmount(c.installmentAmount)} \u20AC`,
        `${c.installmentCount}x`,
        '-',
        getPayerLabel(c.payer, household, t),
      ])
    const total = installmentPayments
      .filter((c) => payers.includes(c.payer))
      .reduce((sum, c) => sum + c.installmentAmount, 0)
    if (data.length) {
      addSection(`${t('charges.installmentTab')} (${data.length})`, data)
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total : ${formatAmount(total)} \u20AC`, pageW - 14, yPos - 2, { align: 'right' })
    }
  }

  // Planned expenses section
  if (chargeTypes.includes('planned')) {
    const data = plannedExpenses
      .filter((c) => payers.includes(c.payer))
      .map((c) => [
        c.name,
        `${formatAmount(c.estimatedAmount)} \u20AC`,
        c.targetMonth,
        '-',
        getPayerLabel(c.payer, household, t),
      ])
    const total = plannedExpenses
      .filter((c) => payers.includes(c.payer))
      .reduce((sum, c) => sum + c.estimatedAmount, 0)
    if (data.length) {
      addSection(`${t('charges.plannedTab')} (${data.length})`, data)
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`Total : ${formatAmount(total)} \u20AC`, pageW - 14, yPos - 2, { align: 'right' })
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setTextColor(...TEXT_MUTED)
    doc.setFontSize(7)
    doc.text(`Monest — ${t('export.pdfGenerated')} ${dateStr()}`, 14, pageH - 8)
    doc.text(`${i}/${pageCount}`, pageW - 14, pageH - 8, { align: 'right' })
  }

  doc.save(`monest-charges-${dateStr()}.pdf`)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
