import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// ─── Regex patterns ─────────────────────────────────────────────────────────

/** DD/MM/YYYY at the start of a string */
const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})/
/** Exact DD/MM/YYYY (value date columns) */
const DATE_EXACT_RE = /^\d{2}\/\d{2}\/\d{4}$/
/** DD.MM.YYYY variant (some banks like Crédit Mutuel) */
const DATE_DOT_RE = /^(\d{2})\.(\d{2})\.(\d{4})/
/** Unsigned amount: "1 234,56" or "1234,56" or "234,56" */
const AMOUNT_UNSIGNED_RE = /^\d[\d\s.]*,\d{2}$/
/** Signed amount: "+1 234,56" or "- 234,56" */
const AMOUNT_SIGNED_RE = /^([+-])\s*(\d[\d\s.]*,\d{2})$/
/** Amount with negative number: "-1 234,56" (no space after -) */
const AMOUNT_NEGATIVE_RE = /^-(\d[\d\s.]*,\d{2})$/
/** Inline amount at end of text: "PRLV 12,50" — captures amount */
const AMOUNT_INLINE_RE = /(\d[\d\s.]*,\d{2})\s*$/

// ─── Types ──────────────────────────────────────────────────────────────────

interface TextItem {
  x: number
  y: number
  text: string
}

type Row = TextItem[]

interface TwoColumnFormat {
  type: 'two-column'
  debitX: number
  creditX: number
  midX: number
}

interface SignedFormat {
  type: 'signed'
  amountX: number
}

interface SingleColumnFormat {
  type: 'single-column'
  amountX: number
}

type TableFormat = TwoColumnFormat | SignedFormat | SingleColumnFormat

interface AmountResult {
  amount: number
  isDebit: boolean
  usedItems: Set<TextItem>
}

interface PDFTransaction {
  date: string
  label: string
  amount: number
  isDebit: boolean
}

interface ParsePDFResult {
  data: Record<string, string>[]
  meta: { fields: string[] }
}

// ─── Text extraction ────────────────────────────────────────────────────────

async function getPageRows(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<Row[]> {
  const page = await pdf.getPage(pageNum)
  const content = await page.getTextContent()

  const items: TextItem[] = (content.items as Array<{ str?: string; transform?: number[] }>)
    .filter((i) => i.str && i.str.trim() && Array.isArray(i.transform) && i.transform.length >= 6)
    .map((i) => ({
      x: Math.round(i.transform![4]),
      y: Math.round(i.transform![5]),
      text: i.str!.trim(),
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  if (!items.length) return []

  // Group into rows by Y proximity (±3px tolerance)
  const rows: Row[] = []
  let row: TextItem[] = [items[0]]
  for (let i = 1; i < items.length; i++) {
    if (Math.abs(items[i].y - row[0].y) <= 3) {
      row.push(items[i])
    } else {
      rows.push(row.sort((a, b) => a.x - b.x))
      row = [items[i]]
    }
  }
  rows.push(row.sort((a, b) => a.x - b.x))
  return rows
}

// ─── Format detection ───────────────────────────────────────────────────────

/**
 * Detect the table format by scanning header rows.
 *
 * Supported formats:
 * - Two-column: Débit / Crédit (BoursoBank, Fortuneo, Hello Bank)
 * - Signed:     Montant with +/- (Caisse d'Épargne, La Banque Postale)
 * - Single-column: Montant / Somme / Opérations without sign (Crédit Agricole, LCL, BNP, SG, Crédit Mutuel)
 */
function detectFormat(rows: Row[]): TableFormat | null {
  for (const row of rows) {
    const joined = row.map((i) => i.text.toLowerCase()).join(' ')

    // Two-column: "Débit" AND "Crédit" headers
    const debit = row.find((i) => /^d[ée]bit$/i.test(i.text))
    const credit = row.find((i) => /^cr[ée]dit$/i.test(i.text))
    if (debit && credit) {
      return {
        type: 'two-column',
        debitX: debit.x,
        creditX: credit.x,
        midX: (debit.x + credit.x) / 2,
      }
    }

    // Signed: single "Montant" header (check it's alone — not near Débit/Crédit)
    const montant = row.find((i) => /^montant$/i.test(i.text))
    if (montant && !debit && !credit) {
      return { type: 'signed', amountX: montant.x }
    }

    // Single-column: various header names used by different banks
    // Crédit Agricole: "Montant en EUR", BNP: "Somme", SG: "Valeur", Crédit Mutuel: "Montant(€)"
    const singleCol = row.find((i) =>
      /^(montant\s*(en\s*eur|\(.\))?|somme|valeur|solde)$/i.test(i.text)
    )
    if (singleCol && !debit && !credit && !montant) {
      return { type: 'single-column', amountX: singleCol.x }
    }

    // Header row detection: "Date" + "Libellé/Désignation/Opération" pattern
    // Some banks don't label the amount column explicitly
    if (/\bdate\b/i.test(joined) && /\b(libell[ée]|d[ée]signation|op[ée]ration|nature)\b/i.test(joined)) {
      // Find the rightmost non-date, non-label item — likely the amount column
      const rightmost = row.reduce((max, i) => (i.x > max.x ? i : max), row[0])
      if (rightmost && !/date|libell|d[ée]sign|op[ée]r|nature/i.test(rightmost.text)) {
        return { type: 'single-column', amountX: rightmost.x }
      }
    }
  }
  return null
}

// ─── Amount finders ─────────────────────────────────────────────────────────

function parseAmountStr(str: string): number {
  return parseFloat(str.replace(/[\s.]/g, '').replace(',', '.'))
}

/** Two-column format: BoursoBank, Fortuneo, Hello Bank */
function findTwoColumnAmount(row: Row, fmt: TwoColumnFormat): AmountResult | null {
  let debit = 0
  let credit = 0
  const used = new Set<TextItem>()

  for (const item of row) {
    if (!AMOUNT_UNSIGNED_RE.test(item.text)) continue
    if (item.x < fmt.debitX - 60) continue

    const val = parseAmountStr(item.text)
    if (!val || isNaN(val)) continue

    used.add(item)
    if (item.x >= fmt.midX) credit = val
    else debit = val
  }

  if (!debit && !credit) return null
  return { amount: debit || credit, isDebit: debit > 0, usedItems: used }
}

/** Signed format: Caisse d'Épargne, La Banque Postale */
function findSignedAmount(row: Row, fmt: SignedFormat): AmountResult | null {
  const minX = fmt.amountX - 120

  // Try single item: "- 220,80" or "+ 915,77"
  for (const item of row) {
    if (item.x < minX) continue
    const match = item.text.match(AMOUNT_SIGNED_RE)
    if (match) {
      const val = parseAmountStr(match[2])
      if (val && !isNaN(val)) {
        return { amount: val, isDebit: match[1] === '-', usedItems: new Set([item]) }
      }
    }
    // Also handle "-1234,56" (no space)
    const negMatch = item.text.match(AMOUNT_NEGATIVE_RE)
    if (negMatch) {
      const val = parseAmountStr(negMatch[1])
      if (val && !isNaN(val)) {
        return { amount: val, isDebit: true, usedItems: new Set([item]) }
      }
    }
  }

  // Try split items: sign item ("+" or "-") followed by an amount item
  for (let i = 0; i < row.length; i++) {
    if (row[i].x < minX) continue
    if (row[i].text === '+' || row[i].text === '-') {
      for (let j = i + 1; j < row.length; j++) {
        if (AMOUNT_UNSIGNED_RE.test(row[j].text)) {
          const val = parseAmountStr(row[j].text)
          if (val && !isNaN(val)) {
            return { amount: val, isDebit: row[i].text === '-', usedItems: new Set([row[i], row[j]]) }
          }
        }
      }
    }
  }

  return null
}

/**
 * Single-column format: amount without explicit sign.
 * Detect debit/credit from context (negative numbers, position, etc.)
 * Used by: Crédit Agricole, BNP, SG, LCL, Crédit Mutuel
 */
function findSingleColumnAmount(row: Row, fmt: SingleColumnFormat): AmountResult | null {
  const minX = fmt.amountX - 120

  for (const item of row) {
    if (item.x < minX) continue

    // Check for negative: "-1 234,56"
    const negMatch = item.text.match(AMOUNT_NEGATIVE_RE)
    if (negMatch) {
      const val = parseAmountStr(negMatch[1])
      if (val && !isNaN(val)) {
        return { amount: val, isDebit: true, usedItems: new Set([item]) }
      }
    }

    // Check for signed: "+ 234,56" or "- 234,56"
    const signMatch = item.text.match(AMOUNT_SIGNED_RE)
    if (signMatch) {
      const val = parseAmountStr(signMatch[2])
      if (val && !isNaN(val)) {
        return { amount: val, isDebit: signMatch[1] === '-', usedItems: new Set([item]) }
      }
    }

    // Unsigned amount — assume debit (most transactions are debits)
    if (AMOUNT_UNSIGNED_RE.test(item.text)) {
      const val = parseAmountStr(item.text)
      if (val && !isNaN(val)) {
        return { amount: val, isDebit: true, usedItems: new Set([item]) }
      }
    }
  }

  return null
}

// ─── Heuristic fallback parser ──────────────────────────────────────────────

/**
 * Last-resort parser: no known format detected.
 * Scans every row for a date pattern + an amount pattern.
 * Works with most French bank PDFs even without header detection.
 */
function heuristicParseRow(row: Row): PDFTransaction | null {
  // 1. Find a date (DD/MM/YYYY or DD.MM.YYYY) anywhere in the row
  let dateItem: TextItem | null = null
  let dd = '', mm = '', yyyy = ''

  for (const item of row) {
    const slashMatch = item.text.match(DATE_RE)
    if (slashMatch) {
      dateItem = item;
      [, dd, mm, yyyy] = slashMatch
      break
    }
    const dotMatch = item.text.match(DATE_DOT_RE)
    if (dotMatch) {
      dateItem = item;
      [, dd, mm, yyyy] = dotMatch
      break
    }
  }
  if (!dateItem) return null

  // 2. Find the best amount candidate (rightmost amount-like value)
  let bestAmount: AmountResult | null = null
  const usedForAmount = new Set<TextItem>()

  // Scan right-to-left for the first valid amount
  for (let i = row.length - 1; i >= 0; i--) {
    const item = row[i]
    if (item === dateItem) continue

    // Signed: "- 123,45" or "+ 123,45"
    const signMatch = item.text.match(AMOUNT_SIGNED_RE)
    if (signMatch) {
      const val = parseAmountStr(signMatch[2])
      if (val && !isNaN(val)) {
        bestAmount = { amount: val, isDebit: signMatch[1] === '-', usedItems: new Set([item]) }
        break
      }
    }

    // Negative: "-123,45"
    const negMatch = item.text.match(AMOUNT_NEGATIVE_RE)
    if (negMatch) {
      const val = parseAmountStr(negMatch[1])
      if (val && !isNaN(val)) {
        bestAmount = { amount: val, isDebit: true, usedItems: new Set([item]) }
        break
      }
    }

    // Unsigned: "123,45"
    if (AMOUNT_UNSIGNED_RE.test(item.text)) {
      const val = parseAmountStr(item.text)
      if (val && !isNaN(val)) {
        // Check if previous item is a sign
        const prevSign = i > 0 && (row[i - 1].text === '+' || row[i - 1].text === '-') ? row[i - 1] : null
        const isDebit = prevSign ? prevSign.text === '-' : true
        const used = new Set([item])
        if (prevSign) used.add(prevSign)
        bestAmount = { amount: val, isDebit, usedItems: used }
        break
      }
    }
  }

  if (!bestAmount) {
    // Last try: look for an amount embedded in text, e.g. "PRLV ASSURANCE 45,00"
    for (let i = row.length - 1; i >= 0; i--) {
      const item = row[i]
      if (item === dateItem) continue
      const inlineMatch = item.text.match(AMOUNT_INLINE_RE)
      if (inlineMatch && item.text !== inlineMatch[1]) {
        const val = parseAmountStr(inlineMatch[1])
        if (val && !isNaN(val) && val < 100000) {
          usedForAmount.add(item)
          bestAmount = { amount: val, isDebit: true, usedItems: usedForAmount }
          break
        }
      }
    }
  }

  if (!bestAmount) return null

  // 3. Build label from remaining items
  const skipItems = new Set<TextItem>([dateItem, ...bestAmount.usedItems])
  // Also skip secondary date items (valeur date)
  for (const item of row) {
    if (item === dateItem) continue
    if (DATE_EXACT_RE.test(item.text) || DATE_DOT_RE.test(item.text)) skipItems.add(item)
  }

  const label = row
    .filter((i) => !skipItems.has(i))
    .map((i) => i.text)
    .join(' ')
    .trim()

  if (!label) return null
  if (isMetadataLabel(label)) return null

  return {
    date: `${yyyy}-${mm}-${dd}`,
    label,
    amount: bestAmount.amount,
    isDebit: bestAmount.isDebit,
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

const METADATA_RE = /Banque|Guichet|Devise|P[ée]riode|TAEG|Montant|Cl[ée]\s*RIB|N[°o]\s*de|IBAN|BIC|Solde\s*(au|en)|Ancien\s*solde|Nouveau\s*solde|Total\s*des|R[ée]capitulatif|Page\s*\d/i

function isMetadataLabel(label: string): boolean {
  return METADATA_RE.test(label)
}

function extractDate(item: TextItem): { dd: string; mm: string; yyyy: string } | null {
  const slashMatch = item.text.match(DATE_RE)
  if (slashMatch) return { dd: slashMatch[1], mm: slashMatch[2], yyyy: slashMatch[3] }
  const dotMatch = item.text.match(DATE_DOT_RE)
  if (dotMatch) return { dd: dotMatch[1], mm: dotMatch[2], yyyy: dotMatch[3] }
  return null
}

function findAmountForFormat(row: Row, fmt: TableFormat): AmountResult | null {
  switch (fmt.type) {
    case 'two-column': return findTwoColumnAmount(row, fmt)
    case 'signed': return findSignedAmount(row, fmt)
    case 'single-column': return findSingleColumnAmount(row, fmt)
  }
}

// ─── Main parser ────────────────────────────────────────────────────────────

export async function parsePDF(file: File): Promise<ParsePDFResult> {
  const buffer = await file.arrayBuffer()
  let pdf: pdfjsLib.PDFDocumentProxy
  try {
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (/password/i.test(msg)) throw new Error('PDF_PASSWORD_PROTECTED')
    throw new Error('PDF_LOAD_FAILED')
  }

  // ── Phase 1: Try structured parsing (known formats) ───────────────────

  const structuredTx: PDFTransaction[] = []
  let fmt: TableFormat | null = null

  for (let p = 1; p <= pdf.numPages; p++) {
    const rows = await getPageRows(pdf, p)

    // Re-detect format on each page (headers may repeat)
    const pageFormat = detectFormat(rows)
    if (pageFormat) fmt = pageFormat
    if (!fmt) continue

    for (const row of rows) {
      const first = row[0]
      if (!first) continue

      const dateInfo = extractDate(first)
      if (!dateInfo) continue

      const result = findAmountForFormat(row, fmt)
      if (!result) continue

      // Build label: skip dates and amount items
      const skipItems = new Set<TextItem>([first, ...result.usedItems])
      for (const item of row) {
        if (item === first) continue
        if (DATE_EXACT_RE.test(item.text) || DATE_DOT_RE.test(item.text)) skipItems.add(item)
      }

      const label = row
        .filter((i) => !skipItems.has(i))
        .map((i) => i.text)
        .join(' ')
        .trim()

      if (!label) continue
      if (isMetadataLabel(label)) continue

      structuredTx.push({
        date: `${dateInfo.yyyy}-${dateInfo.mm}-${dateInfo.dd}`,
        label,
        amount: result.amount,
        isDebit: result.isDebit,
      })
    }
  }

  if (structuredTx.length > 0) {
    return formatOutput(structuredTx)
  }

  // ── Phase 2: Heuristic fallback (no known format detected) ────────────

  const heuristicTx: PDFTransaction[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const rows = await getPageRows(pdf, p)
    for (const row of rows) {
      const tx = heuristicParseRow(row)
      if (tx) heuristicTx.push(tx)
    }
  }

  if (heuristicTx.length > 0) {
    return formatOutput(heuristicTx)
  }

  // ── Phase 3: Nothing found — throw descriptive error ──────────────────

  // Check if we found any text at all (could be scanned PDF / image-based)
  let totalTextItems = 0
  for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
    const rows = await getPageRows(pdf, p)
    totalTextItems += rows.reduce((sum, r) => sum + r.length, 0)
  }

  if (totalTextItems < 5) {
    throw new Error('PDF_SCANNED')
  }

  throw new Error('NO_TRANSACTIONS')
}

// ─── Output formatting ──────────────────────────────────────────────────────

function formatOutput(transactions: PDFTransaction[]): ParsePDFResult {
  // Deduplicate: same date + label + amount
  const seen = new Set<string>()
  const unique = transactions.filter((tx) => {
    const key = `${tx.date}|${tx.label}|${tx.amount}|${tx.isDebit}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    data: unique.map((tx) => ({
      date: tx.date,
      'libellé': tx.label,
      'débit': tx.isDebit ? String(tx.amount) : '',
      'crédit': tx.isDebit ? '' : String(tx.amount),
    })),
    meta: { fields: ['date', 'libellé', 'débit', 'crédit'] },
  }
}
