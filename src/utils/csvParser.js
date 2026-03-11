import Papa from 'papaparse'

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    // Try UTF-8 first, fallback to latin1
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        // Check if we got garbled text (sign of wrong encoding)
        const sample = JSON.stringify(results.data.slice(0, 3))
        if (sample.includes('Ã©') || sample.includes('Ã¨') || sample.includes('Ã ')) {
          // Re-parse with latin1
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'latin1',
            complete: (r) => resolve(r),
            error: (e) => reject(e),
          })
        } else {
          resolve(results)
        }
      },
      error: (error) => reject(error),
    })
  })
}

export function detectColumns(headers) {
  const lower = headers.map((h) => h.toLowerCase().trim())

  const dateIdx = lower.findIndex((h) => h.includes('date'))
  const labelIdx = lower.findIndex((h) => h.includes('libellé') || h.includes('libelle') || h.includes('label'))
  const debitIdx = lower.findIndex((h) => h.includes('débit') || h.includes('debit'))
  const amountIdx = lower.findIndex((h) => h.includes('montant') || h.includes('amount'))
  const creditIdx = lower.findIndex((h) => h.includes('crédit') || h.includes('credit'))

  const dateCol = headers[dateIdx >= 0 ? dateIdx : 0]
  const labelCol = headers[labelIdx >= 0 ? labelIdx : 1]
  const debitCol = headers[debitIdx >= 0 ? debitIdx : (amountIdx >= 0 ? amountIdx : -1)] || null
  const creditCol = creditIdx >= 0 ? headers[creditIdx] : null

  return { dateCol, labelCol, debitCol, creditCol }
}

function normalizeLabel(label) {
  return label
    .toUpperCase()
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\d{2}\/\d{2}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseAmount(str) {
  if (!str || str.trim() === '') return 0
  return Math.abs(
    parseFloat(
      str
        .replace(/\s/g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '')
    )
  )
}

function stddev(values) {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2))
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function detectFrequency(dates) {
  if (dates.length < 2) return 'monthly'
  const sorted = [...dates].sort()
  const diffs = []
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1])
    const d2 = new Date(sorted[i])
    const daysDiff = (d2 - d1) / (1000 * 60 * 60 * 24)
    if (!isNaN(daysDiff)) diffs.push(daysDiff)
  }
  if (diffs.length === 0) return 'monthly'
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
  if (avgDiff < 45) return 'monthly'
  if (avgDiff < 75) return 'bimonthly'
  if (avgDiff < 120) return 'quarterly'
  return 'annual'
}

function parseDate(dateStr) {
  if (!dateStr) return null
  // DD/MM/YYYY
  let match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  // DD-MM-YYYY or DD.MM.YYYY
  match = dateStr.match(/(\d{2})[.-](\d{2})[.-](\d{4})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  // DD/MM/YY
  match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})$/)
  if (match) return `20${match[3]}-${match[2]}-${match[1]}`
  // YYYY-MM-DD
  if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr
  return dateStr
}

export function detectRecurring(data, columns) {
  const { dateCol, labelCol, debitCol, creditCol } = columns

  if (!debitCol) return []

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
    .filter((t) => t.isDebit)

  const groups = {}
  transactions.forEach((t) => {
    if (!groups[t.normalized]) groups[t.normalized] = []
    groups[t.normalized].push(t)
  })

  return Object.entries(groups)
    .filter(([, txs]) => txs.length >= 2)
    .map(([key, txs]) => {
      const amounts = txs.map((t) => t.amount)
      const avg = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0
      const sd = stddev(amounts)
      const frequency = detectFrequency(txs.map((t) => t.date))

      return {
        suggestedName: key,
        originalLabels: [...new Set(txs.map((t) => t.label))],
        avgAmount: Math.round(avg * 100) / 100,
        frequency,
        occurrences: txs.length,
        isStable: amounts.length === 1 || (avg > 0 && sd / avg < 0.1),
        dates: txs.map((t) => t.date).sort(),
      }
    })
    .sort((a, b) => b.occurrences - a.occurrences)
}
