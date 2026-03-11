import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).href

const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})/
const DATE_EXACT_RE = /^\d{2}\/\d{2}\/\d{4}$/
const AMOUNT_UNSIGNED_RE = /^\d[\d\s.]*,\d{2}$/
const AMOUNT_SIGNED_RE = /^([+-])\s*(\d[\d\s.]*,\d{2})$/

/**
 * Extract text items from a PDF page, grouped into rows by Y position
 */
async function getPageRows(pdf, pageNum) {
  const page = await pdf.getPage(pageNum)
  const content = await page.getTextContent()

  const items = content.items
    .filter((i) => i.str?.trim())
    .map((i) => ({
      x: Math.round(i.transform[4]),
      y: Math.round(i.transform[5]),
      text: i.str.trim(),
    }))
    .sort((a, b) => b.y - a.y || a.x - b.x)

  if (!items.length) return []

  // Group into rows by Y proximity (±3px tolerance)
  const rows = []
  let row = [items[0]]
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

/**
 * Detect the table format:
 * - 'two-column': BoursoBank-style with separate Débit/Crédit columns
 * - 'signed': Caisse d'Épargne-style with single signed MONTANT column
 */
function detectFormat(rows) {
  for (const row of rows) {
    // BoursoBank: separate Débit and Crédit columns
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

    // Caisse d'Épargne / most French banks: single MONTANT column with +/- signs
    const montant = row.find((i) => /^montant$/i.test(i.text))
    if (montant) {
      return { type: 'signed', amountX: montant.x }
    }
  }
  return null
}

function parseAmountStr(str) {
  return parseFloat(str.replace(/[\s.]/g, '').replace(',', '.'))
}

/**
 * Find the amount in a two-column (Débit/Crédit) format — BoursoBank
 */
function findTwoColumnAmount(row, format) {
  let debit = 0
  let credit = 0
  const used = new Set()

  for (const item of row) {
    if (!AMOUNT_UNSIGNED_RE.test(item.text)) continue
    if (item.x < format.debitX - 60) continue

    const val = parseAmountStr(item.text)
    if (!val || isNaN(val)) continue

    used.add(item)
    if (item.x >= format.midX) credit = val
    else debit = val
  }

  if (!debit && !credit) return null
  return { amount: debit || credit, isDebit: debit > 0, usedItems: used }
}

/**
 * Find the amount in a signed (MONTANT) format — Caisse d'Épargne
 * Amounts look like: "+ 915,77" or "- 220,80"
 * May be a single text item or split into sign + number items
 */
function findSignedAmount(row, format) {
  const minX = format.amountX - 120

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
 * Parse a PDF bank statement file (BoursoBank, Caisse d'Épargne, etc.)
 * Returns data in the same format as the CSV parser output
 */
export async function parsePDF(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const transactions = []
  let format = null

  for (let p = 1; p <= pdf.numPages; p++) {
    const rows = await getPageRows(pdf, p)

    // Detect format on each page (header repeats)
    const pageFormat = detectFormat(rows)
    if (pageFormat) format = pageFormat
    if (!format) continue

    for (const row of rows) {
      // Transaction rows must start with a date DD/MM/YYYY
      const first = row[0]
      if (!first || !DATE_RE.test(first.text)) continue

      const [, dd, mm, yyyy] = first.text.match(DATE_RE)

      // Find amount based on detected format
      const result =
        format.type === 'two-column'
          ? findTwoColumnAmount(row, format)
          : findSignedAmount(row, format)

      if (!result) continue

      // Build label: skip operation date, valeur date, amount/sign items
      const skipItems = new Set([first, ...result.usedItems])
      for (const item of row) {
        if (item === first) continue
        if (DATE_EXACT_RE.test(item.text)) skipItems.add(item)
      }

      const label = row
        .filter((i) => !skipItems.has(i))
        .map((i) => i.text)
        .join(' ')
        .trim()

      if (!label) continue
      // Skip header/metadata rows that happen to start with a date
      if (/Banque|Guichet|Devise|P[ée]riode|TAEG|Montant|Cl[ée]\s*RIB|N[°o]\s*de/i.test(label)) continue

      transactions.push({
        date: `${yyyy}-${mm}-${dd}`,
        label,
        amount: result.amount,
        isDebit: result.isDebit,
      })
    }
  }

  if (!transactions.length) throw new Error('NO_TRANSACTIONS')

  return {
    data: transactions.map((tx) => ({
      date: tx.date,
      'libellé': tx.label,
      'débit': tx.isDebit ? String(tx.amount) : '',
      'crédit': tx.isDebit ? '' : String(tx.amount),
    })),
    meta: { fields: ['date', 'libellé', 'débit', 'crédit'] },
  }
}
