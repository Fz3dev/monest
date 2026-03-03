import Papa from 'papaparse'

/**
 * Parse a CSV file (client-side only)
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'latin1',
      complete: (results) => {
        resolve(results)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

/**
 * Detect columns in parsed CSV data
 * Supports BoursoBank format and attempts auto-detection
 */
export function detectColumns(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim())

  // BoursoBank format
  const dateCol = headers[lower.findIndex((h) => h.includes('date'))] || headers[0]
  const labelCol =
    headers[lower.findIndex((h) => h.includes('libellé') || h.includes('libelle') || h.includes('label'))] ||
    headers[1]
  const debitCol =
    headers[lower.findIndex((h) => h.includes('débit') || h.includes('debit'))] ||
    headers[lower.findIndex((h) => h.includes('montant') || h.includes('amount'))]
  const creditCol = headers[lower.findIndex((h) => h.includes('crédit') || h.includes('credit'))]

  return { dateCol, labelCol, debitCol, creditCol }
}

/**
 * Normalize transaction label for grouping
 */
function normalizeLabel(label) {
  return label
    .toUpperCase()
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // remove dates
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\b\d+\b/g, '') // remove standalone numbers
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse amount string (French format: 1 234,56)
 */
function parseAmount(str) {
  if (!str || str.trim() === '') return 0
  return Math.abs(
    parseFloat(
      str
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace(/[^0-9.\-]/g, '')
    )
  )
}

/**
 * Calculate standard deviation
 */
function stddev(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2))
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length)
}

/**
 * Detect frequency from dates
 */
function detectFrequency(dates) {
  if (dates.length < 2) return 'monthly'
  const sorted = [...dates].sort()
  const diffs = []
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1])
    const d2 = new Date(sorted[i])
    const daysDiff = (d2 - d1) / (1000 * 60 * 60 * 24)
    diffs.push(daysDiff)
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
  if (avgDiff < 45) return 'monthly'
  if (avgDiff < 75) return 'bimonthly'
  if (avgDiff < 120) return 'quarterly'
  return 'annual'
}

/**
 * Parse date from various French formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null
  // DD/MM/YYYY
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  // YYYY-MM-DD
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr
  return dateStr
}

/**
 * Detect recurring transactions from parsed CSV data
 */
export function detectRecurring(data, columns) {
  const { dateCol, labelCol, debitCol, creditCol } = columns

  const transactions = data
    .map((row) => {
      const debit = parseAmount(row[debitCol])
      const credit = creditCol ? parseAmount(row[creditCol]) : 0
      const amount = debit || credit
      if (!amount) return null
      return {
        date: parseDate(row[dateCol]),
        label: row[labelCol] || '',
        amount,
        isDebit: debit > 0,
        normalized: normalizeLabel(row[labelCol] || ''),
      }
    })
    .filter(Boolean)
    .filter((t) => t.isDebit) // Only detect recurring debits

  // Group by normalized label
  const groups = {}
  transactions.forEach((t) => {
    if (!groups[t.normalized]) groups[t.normalized] = []
    groups[t.normalized].push(t)
  })

  // Filter groups with >= 2 occurrences
  return Object.entries(groups)
    .filter(([_, txs]) => txs.length >= 2)
    .map(([key, txs]) => {
      const amounts = txs.map((t) => t.amount)
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
      const sd = stddev(amounts)
      const frequency = detectFrequency(txs.map((t) => t.date))

      return {
        suggestedName: key,
        originalLabels: [...new Set(txs.map((t) => t.label))],
        avgAmount: Math.round(avg * 100) / 100,
        frequency,
        occurrences: txs.length,
        isStable: amounts.length === 1 || sd / avg < 0.1,
        dates: txs.map((t) => t.date).sort(),
      }
    })
    .sort((a, b) => b.occurrences - a.occurrences)
}
