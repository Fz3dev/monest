import { getCategoryLabel, getFrequencyLabel } from './format'
import type { FixedCharge, InstallmentPayment, PlannedExpense, Household, Payer, ChargeDetail } from '../types'
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

export interface MonthExportOptions {
  format: ExportFormat
  chargeTypes: ChargeTypeFilter[]
  payers: Payer[]
  charges: ChargeDetail[]
  month: string
  monthLabel: string
  household: Household | null
  t: TFunction
}

function getPayerLabel(payer: Payer, household: Household | null, t: TFunction): string {
  if (payer === 'common') return t('payer.common')
  if (payer === 'person_a') return household?.personAName || t('common.personA')
  if (payer === 'person_b') return household?.personBName || t('common.personB')
  return payer
}

function formatAmount(amount: number): string {
  // Replace non-breaking spaces (U+202F, U+00A0) with regular spaces — jsPDF can't render them
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(amount)
    .replace(/[\u00A0\u202F]/g, ' ')
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
  const SUBTOTAL_BG: [number, number, number] = [240, 238, 255]
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
    // Crown logo on every page
    if (logoData) {
      doc.addImage(logoData, 'PNG', 14, isFirstPage ? 10 : 5, isFirstPage ? 10 : 7, isFirstPage ? 10 : 7)
    }
    const textX = logoData ? (isFirstPage ? 27 : 24) : 14

    if (isFirstPage) {
      doc.setTextColor(...BRAND)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Monest', textX, 18)

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

      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.4)
      doc.line(14, 24, pageW - 14, 24)
    } else {
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Monest', textX, 10)
      doc.text(dateStr(), pageW - 14, 10, { align: 'right' })
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.line(14, 13, pageW - 14, 13)
    }
  }

  // ─── Payer ordering: common first, then person_a, then person_b ────────
  const payerOrder: Payer[] = ['common', 'person_a', 'person_b']
  const activePayers = payerOrder.filter((p) => payers.includes(p))

  // ─── Draw first page ───────────────────────────────────────────────────
  drawPageHeader(true)
  let yPos = 30

  // Title
  doc.setTextColor(...TEXT_DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(t('export.pdfTitle'), 14, yPos)

  // Payer info
  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const payerLabels = activePayers.map((p) => getPayerLabel(p, household, t))
  doc.text(`${t('export.pdfPayerFilter')} ${payerLabels.join(', ')}`, 14, yPos + 6)
  yPos += 14

  let lastKnownPageCount = 1

  // ─── Ensure enough space or create new page ─────────────────────────────
  const ensureSpace = (needed: number) => {
    if (yPos > pageH - needed) {
      doc.addPage()
      drawPageHeader(false)
      lastKnownPageCount = doc.getNumberOfPages()
      yPos = 20
    }
  }

  // ─── Table helper (no "Payeur" column — grouped by payer instead) ──────
  const drawTable = (data: string[][]) => {
    autoTable(doc, {
      startY: yPos,
      head: [[
        t('export.colName'),
        t('export.colAmount'),
        t('export.colFrequency'),
        t('export.colCategory'),
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
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 30 },
      },
      margin: { left: 14, right: 14, top: 20, bottom: 18 },
      didDrawPage: () => {
        const currentPages = doc.getNumberOfPages()
        if (currentPages > lastKnownPageCount) {
          drawPageHeader(false)
          lastKnownPageCount = currentPages
        }
      },
    })
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2
  }

  // ─── Sub-total line ─────────────────────────────────────────────────────
  const drawSubTotal = (label: string, amount: number) => {
    doc.setFillColor(...SUBTOTAL_BG)
    doc.roundedRect(14, yPos - 1, pageW - 28, 7, 1, 1, 'F')
    doc.setTextColor(...BRAND)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(label, 17, yPos + 3.5)
    doc.text(`${formatAmount(amount)} \u20AC`, pageW - 17, yPos + 3.5, { align: 'right' })
    yPos += 10
  }

  // ─── Grand total line ──────────────────────────────────────────────────
  const drawGrandTotal = (amount: number) => {
    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.5)
    doc.line(pageW - 80, yPos - 2, pageW - 14, yPos - 2)
    doc.setTextColor(...BRAND)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total : ${formatAmount(amount)} \u20AC`, pageW - 14, yPos + 3, { align: 'right' })
    yPos += 12
  }

  // ─── Section: grouped by payer, sorted by amount desc ──────────────────
  type ChargeItem = { name: string; amount: number; payer: Payer; cols: string[] }

  const addGroupedSection = (title: string, items: ChargeItem[]) => {
    if (!items.length) return

    ensureSpace(45)

    // Section header
    doc.setFillColor(...BRAND_LIGHT)
    doc.roundedRect(14, yPos - 5, pageW - 28, 8, 1, 1, 'F')
    doc.setTextColor(...BRAND)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 17, yPos)
    yPos += 6

    let grandTotal = 0

    for (const payer of activePayers) {
      const group = items
        .filter((item) => item.payer === payer)
        .sort((a, b) => b.amount - a.amount)
      if (!group.length) continue

      const groupTotal = group.reduce((sum, item) => sum + item.amount, 0)
      grandTotal += groupTotal

      // Payer sub-header
      ensureSpace(30)
      const payerLabel = getPayerLabel(payer, household, t)
      doc.setTextColor(...TEXT_DARK)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${payerLabel} (${group.length})`, 16, yPos)
      yPos += 3

      // Table rows
      drawTable(group.map((item) => item.cols))

      // Sub-total
      drawSubTotal(`Sous-total ${payerLabel}`, groupTotal)
    }

    // Grand total for the section
    drawGrandTotal(grandTotal)
  }

  // ─── Fixed charges ──────────────────────────────────────────────────────
  if (chargeTypes.includes('fixed')) {
    const items: ChargeItem[] = fixedCharges
      .filter((c) => activePayers.includes(c.payer) && c.active)
      .map((c) => ({
        name: c.name,
        amount: c.amount,
        payer: c.payer,
        cols: [c.name, `${formatAmount(c.amount)} \u20AC`, getFrequencyLabel(c.frequency), getCategoryLabel(c.category)],
      }))
    addGroupedSection(`${t('charges.fixedTab')} (${items.length})`, items)
  }

  // ─── Installment payments ───────────────────────────────────────────────
  if (chargeTypes.includes('installment')) {
    const items: ChargeItem[] = installmentPayments
      .filter((c) => activePayers.includes(c.payer))
      .map((c) => ({
        name: c.name,
        amount: c.installmentAmount,
        payer: c.payer,
        cols: [c.name, `${formatAmount(c.installmentAmount)} \u20AC`, `${c.installmentCount}x`, '-'],
      }))
    addGroupedSection(`${t('charges.installmentTab')} (${items.length})`, items)
  }

  // ─── Planned expenses ──────────────────────────────────────────────────
  if (chargeTypes.includes('planned')) {
    const items: ChargeItem[] = plannedExpenses
      .filter((c) => activePayers.includes(c.payer))
      .map((c) => ({
        name: c.name,
        amount: c.estimatedAmount,
        payer: c.payer,
        cols: [c.name, `${formatAmount(c.estimatedAmount)} \u20AC`, c.targetMonth, '-'],
      }))
    addGroupedSection(`${t('charges.plannedTab')} (${items.length})`, items)
  }

  // ─── Footer on every page ──────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    doc.setTextColor(...TEXT_MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Monest — ${t('export.pdfGenerated')} ${dateStr()}`, 14, pageH - 7)
    doc.text(`${i}/${totalPages}`, pageW - 14, pageH - 7, { align: 'right' })
  }

  doc.save(`monest-charges-${dateStr()}.pdf`)
}

// ─── Month-specific CSV Export ───────────────────────────────────────────────

function buildMonthRows(opts: MonthExportOptions): Record<string, string>[] {
  const { charges, household, t } = opts
  const typeLabels: Record<string, string> = {
    fixed: t('charges.fixedTab'),
    installment: t('charges.installmentTab'),
    planned: t('charges.plannedTab'),
  }

  return charges.map((c) => ({
    [t('export.colType')]: typeLabels[c.type] || c.type,
    [t('export.colName')]: c.name,
    [t('export.colAmount')]: formatAmount(c.amount),
    [t('export.colCategory')]: c.category ? getCategoryLabel(c.category) : '-',
    [t('export.colPayer')]: getPayerLabel(c.payer, household, t),
  }))
}

export async function exportMonthCSV(opts: MonthExportOptions): Promise<void> {
  const rows = buildMonthRows(opts)
  if (!rows.length) return

  const Papa = (await import('papaparse')).default
  const csv = Papa.unparse(rows, { delimiter: ';' })
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `monest-charges-${opts.month}.csv`)
}

// ─── Month-specific PDF Export ──────────────────────────────────────────────

export async function exportMonthPDF(opts: MonthExportOptions): Promise<void> {
  const { charges, payers, household, t, monthLabel } = opts
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const BRAND: [number, number, number] = [108, 99, 255]
  const BRAND_LIGHT: [number, number, number] = [237, 235, 255]
  const TEXT_DARK: [number, number, number] = [30, 30, 40]
  const TEXT_MUTED: [number, number, number] = [120, 120, 135]
  const ROW_ALT: [number, number, number] = [248, 248, 252]
  const BORDER: [number, number, number] = [220, 220, 230]
  const SUBTOTAL_BG: [number, number, number] = [240, 238, 255]
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  let logoData: string | null = null
  try { logoData = await loadLogoBase64() } catch { /* */ }

  const drawPageHeader = (isFirstPage: boolean) => {
    if (logoData) {
      doc.addImage(logoData, 'PNG', 14, isFirstPage ? 10 : 5, isFirstPage ? 10 : 7, isFirstPage ? 10 : 7)
    }
    const textX = logoData ? (isFirstPage ? 27 : 24) : 14

    if (isFirstPage) {
      doc.setTextColor(...BRAND)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Monest', textX, 18)

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

      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.4)
      doc.line(14, 24, pageW - 14, 24)
    } else {
      doc.setTextColor(...TEXT_MUTED)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Monest', textX, 10)
      doc.text(dateStr(), pageW - 14, 10, { align: 'right' })
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.line(14, 13, pageW - 14, 13)
    }
  }

  const payerOrder: Payer[] = ['common', 'person_a', 'person_b']
  const activePayers = payerOrder.filter((p) => payers.includes(p))

  drawPageHeader(true)
  let yPos = 30

  // Title with month
  doc.setTextColor(...TEXT_DARK)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`${t('export.pdfTitle')} — ${monthLabel}`, 14, yPos)

  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const payerLabels = activePayers.map((p) => getPayerLabel(p, household, t))
  doc.text(`${t('export.pdfPayerFilter')} ${payerLabels.join(', ')}`, 14, yPos + 6)
  yPos += 14

  let lastKnownPageCount = 1

  const ensureSpace = (needed: number) => {
    if (yPos > pageH - needed) {
      doc.addPage()
      drawPageHeader(false)
      lastKnownPageCount = doc.getNumberOfPages()
      yPos = 20
    }
  }

  const drawTable = (data: string[][]) => {
    autoTable(doc, {
      startY: yPos,
      head: [[t('export.colName'), t('export.colAmount'), t('export.colCategory')]],
      body: data,
      theme: 'striped',
      showHead: 'everyPage',
      tableWidth: 'auto',
      styles: {
        textColor: TEXT_DARK, fontSize: 8,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        lineColor: BORDER, lineWidth: 0.1, overflow: 'linebreak',
      },
      headStyles: {
        fillColor: BRAND, textColor: [255, 255, 255] as [number, number, number],
        fontSize: 8, fontStyle: 'bold', cellPadding: 3,
      },
      bodyStyles: { fillColor: [255, 255, 255] as [number, number, number] },
      alternateRowStyles: { fillColor: ROW_ALT },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 30 },
      },
      margin: { left: 14, right: 14, top: 20, bottom: 18 },
      didDrawPage: () => {
        const currentPages = doc.getNumberOfPages()
        if (currentPages > lastKnownPageCount) {
          drawPageHeader(false)
          lastKnownPageCount = currentPages
        }
      },
    })
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2
  }

  const drawSubTotal = (label: string, amount: number) => {
    doc.setFillColor(...SUBTOTAL_BG)
    doc.roundedRect(14, yPos - 1, pageW - 28, 7, 1, 1, 'F')
    doc.setTextColor(...BRAND)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(label, 17, yPos + 3.5)
    doc.text(`${formatAmount(amount)} \u20AC`, pageW - 17, yPos + 3.5, { align: 'right' })
    yPos += 10
  }

  const drawGrandTotal = (amount: number) => {
    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.5)
    doc.line(pageW - 80, yPos - 2, pageW - 14, yPos - 2)
    doc.setTextColor(...BRAND)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total : ${formatAmount(amount)} \u20AC`, pageW - 14, yPos + 3, { align: 'right' })
    yPos += 12
  }

  // Group charges by type, then by payer
  type ChargeItem = { name: string; amount: number; payer: Payer; cols: string[] }

  const addGroupedSection = (title: string, items: ChargeItem[]) => {
    if (!items.length) return

    ensureSpace(45)
    doc.setFillColor(...BRAND_LIGHT)
    doc.roundedRect(14, yPos - 5, pageW - 28, 8, 1, 1, 'F')
    doc.setTextColor(...BRAND)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(title, 17, yPos)
    yPos += 6

    let grandTotal = 0

    for (const payer of activePayers) {
      const group = items.filter((item) => item.payer === payer).sort((a, b) => b.amount - a.amount)
      if (!group.length) continue

      const groupTotal = group.reduce((sum, item) => sum + item.amount, 0)
      grandTotal += groupTotal

      ensureSpace(30)
      const payerLabel = getPayerLabel(payer, household, t)
      doc.setTextColor(...TEXT_DARK)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(`${payerLabel} (${group.length})`, 16, yPos)
      yPos += 3

      drawTable(group.map((item) => item.cols))
      drawSubTotal(`Sous-total ${payerLabel}`, groupTotal)
    }

    drawGrandTotal(grandTotal)
  }

  // Build sections from ChargeDetail[]
  const typeLabels: Record<string, string> = {
    fixed: t('charges.fixedTab'),
    installment: t('charges.installmentTab'),
    planned: t('charges.plannedTab'),
  }

  for (const type of ['fixed', 'installment', 'planned'] as const) {
    const typeCharges = charges.filter((c) => c.type === type)
    if (!typeCharges.length) continue

    const items: ChargeItem[] = typeCharges.map((c) => ({
      name: c.name,
      amount: c.amount,
      payer: c.payer,
      cols: [c.name, `${formatAmount(c.amount)} \u20AC`, c.category ? getCategoryLabel(c.category) : '-'],
    }))

    addGroupedSection(`${typeLabels[type]} (${items.length})`, items)
  }

  // Footer
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    doc.setTextColor(...TEXT_MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Monest — ${t('export.pdfGenerated')} ${dateStr()}`, 14, pageH - 7)
    doc.text(`${i}/${totalPages}`, pageW - 14, pageH - 7, { align: 'right' })
  }

  doc.save(`monest-charges-${opts.month}.pdf`)
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
