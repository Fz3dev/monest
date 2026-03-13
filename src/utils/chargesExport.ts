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
  const response = await fetch('/logo-crown-sm.png')
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

  // ─── Color palette (light theme, print-friendly) ────────────────────────
  const BRAND: [number, number, number] = [108, 99, 255]
  const BRAND_LIGHT: [number, number, number] = [237, 235, 255]
  const TEXT_DARK: [number, number, number] = [30, 30, 40]
  const TEXT_MUTED: [number, number, number] = [120, 120, 135]
  const ROW_ALT: [number, number, number] = [248, 248, 252]
  const BORDER: [number, number, number] = [220, 220, 230]
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // ─── Pre-load logo once ─────────────────────────────────────────────────
  let logoData: string | null = null
  try {
    logoData = await loadLogoBase64()
  } catch {
    // Logo unavailable — fallback to text
  }

  // ─── Draw page header ────────────────────────────────────────────────────
  const drawPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Crown logo (square 128x128 → 10x10mm)
      if (logoData) {
        doc.addImage(logoData, 'PNG', 14, 10, 10, 10)
      }
      // "Monest" title next to logo
      doc.setTextColor(...BRAND)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Monest', logoData ? 27 : 14, 18)

      // Date + household name (right side)
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(dateStr(), pageW - 14, 13, { align: 'right' })
      if (household?.name) {
        doc.setTextColor(...TEXT_DARK)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(household.name, pageW - 14, 19, { align: 'right' })
      }

      // Subtle separator line
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.4)
      doc.line(14, 24, pageW - 14, 24)
    } else {
      // Continuation pages: light header
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Monest', 14, 10)
      doc.text(dateStr(), pageW - 14, 10, { align: 'right' })
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.line(14, 13, pageW - 14, 13)
    }
  }

  // ─── Draw first page header ─────────────────────────────────────────────
  drawPageHeader(true)

  let yPos = 30

  // Subtitle
  doc.setTextColor(...TEXT_DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdfTitle'), 14, yPos)

  // Payer filter (same line, right of title)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const payerLabels = payers.map((p) => getPayerLabel(p, household, t))
  doc.text(`${t('export.pdfPayerFilter')} ${payerLabels.join(', ')}`, 14, yPos + 6)
  yPos += 14

  // Track total pages created so far (to know when autoTable adds new ones)
  let lastKnownPageCount = 1

  // ─── Section helper ─────────────────────────────────────────────────────
  const addSection = (title: string, data: string[][], totalAmount: number) => {
    if (!data.length) return

    // Need new page?
    if (yPos > pageH - 45) {
      doc.addPage()
      drawPageHeader(false)
      yPos = 24
    }

    // Section title with brand accent line
    doc.setFillColor(...BRAND_LIGHT)
    doc.roundedRect(14, yPos - 5, pageW - 28, 8, 1, 1, 'F')
    doc.setTextColor(...BRAND)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 17, yPos)
    yPos += 6

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
      theme: 'striped',
      showHead: 'everyPage',
      tableWidth: 'auto',
      styles: {
        textColor: TEXT_DARK,
        fontSize: 8,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        lineColor: BORDER,
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: BRAND,
        textColor: [255, 255, 255] as [number, number, number],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 3,
      },
      bodyStyles: {
        fillColor: [255, 255, 255] as [number, number, number],
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },                          // Name — flexible
        1: { halign: 'right', cellWidth: 28 },             // Amount — right-aligned
        2: { halign: 'center', cellWidth: 24 },            // Frequency — centered
        3: { halign: 'center', cellWidth: 28 },            // Category — centered
        4: { halign: 'center', cellWidth: 28 },            // Payer — centered
      },
      margin: { left: 14, right: 14, bottom: 18 },
      didDrawPage: () => {
        // Draw header on pages auto-created by autoTable
        const currentPages = doc.getNumberOfPages()
        if (currentPages > lastKnownPageCount) {
          drawPageHeader(false)
          lastKnownPageCount = currentPages
        }
      },
    })

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3

    // Total row (right-aligned, brand color)
    doc.setTextColor(...BRAND)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total : ${formatAmount(totalAmount)} \u20AC`, pageW - 14, yPos, { align: 'right' })
    yPos += 10
  }

  // ─── Sections ───────────────────────────────────────────────────────────
  if (chargeTypes.includes('fixed')) {
    const filtered = fixedCharges.filter((c) => payers.includes(c.payer) && c.active)
    const data = filtered.map((c) => [
      c.name,
      `${formatAmount(c.amount)} \u20AC`,
      getFrequencyLabel(c.frequency),
      getCategoryLabel(c.category),
      getPayerLabel(c.payer, household, t),
    ])
    const total = filtered.reduce((sum, c) => sum + c.amount, 0)
    addSection(`${t('charges.fixedTab')} (${filtered.length})`, data, total)
  }

  if (chargeTypes.includes('installment')) {
    const filtered = installmentPayments.filter((c) => payers.includes(c.payer))
    const data = filtered.map((c) => [
      c.name,
      `${formatAmount(c.installmentAmount)} \u20AC`,
      `${c.installmentCount}x`,
      '-',
      getPayerLabel(c.payer, household, t),
    ])
    const total = filtered.reduce((sum, c) => sum + c.installmentAmount, 0)
    addSection(`${t('charges.installmentTab')} (${filtered.length})`, data, total)
  }

  if (chargeTypes.includes('planned')) {
    const filtered = plannedExpenses.filter((c) => payers.includes(c.payer))
    const data = filtered.map((c) => [
      c.name,
      `${formatAmount(c.estimatedAmount)} \u20AC`,
      c.targetMonth,
      '-',
      getPayerLabel(c.payer, household, t),
    ])
    const total = filtered.reduce((sum, c) => sum + c.estimatedAmount, 0)
    addSection(`${t('charges.plannedTab')} (${filtered.length})`, data, total)
  }

  // ─── Footer on every page ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    // Thin separator line
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    // Footer text
    doc.setTextColor(...TEXT_MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Monest — ${t('export.pdfGenerated')} ${dateStr()}`, 14, pageH - 7)
    doc.text(`${i}/${totalPages}`, pageW - 14, pageH - 7, { align: 'right' })
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
