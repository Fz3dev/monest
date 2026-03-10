import { describe, it, expect } from 'vitest'

// Test the CSV generation logic (extracted from SettingsPage)
function generateCSV(expenses) {
  const rows = [['Date', 'Categorie', 'Note', 'Montant', 'Paye par']]
  expenses.forEach((e) => {
    rows.push([
      e.date || '',
      e.category || '',
      (e.note || '').replace(/"/g, '""'),
      String(e.amount || 0),
      e.payer || '',
    ])
  })
  return rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
}

describe('CSV export', () => {
  it('generates header row', () => {
    const csv = generateCSV([])
    expect(csv).toBe('"Date","Categorie","Note","Montant","Paye par"')
  })

  it('generates rows with data', () => {
    const csv = generateCSV([
      { date: '2026-03-10', category: 'alimentation', note: 'Courses', amount: 45, payer: 'person_a' },
    ])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('"2026-03-10","alimentation","Courses","45","person_a"')
  })

  it('handles missing fields', () => {
    const csv = generateCSV([{ amount: 30 }])
    const lines = csv.split('\n')
    expect(lines[1]).toBe('"","","","30",""')
  })

  it('escapes double quotes in notes', () => {
    const csv = generateCSV([
      { date: '2026-03-10', note: 'Test "quote" here', amount: 10 },
    ])
    expect(csv).toContain('Test ""quote"" here')
  })

  it('handles multiple rows', () => {
    const csv = generateCSV([
      { date: '2026-03-10', amount: 45, category: 'alimentation', note: 'Courses' },
      { date: '2026-03-11', amount: 25, category: 'transport', note: 'Essence' },
      { date: '2026-03-12', amount: 60, category: 'loisirs', note: 'Restaurant' },
    ])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(4) // header + 3 rows
  })

  it('handles zero amounts', () => {
    const csv = generateCSV([{ date: '2026-03-10', amount: 0 }])
    expect(csv).toContain('"0"')
  })

  it('handles negative amounts (refunds)', () => {
    const csv = generateCSV([{ date: '2026-03-10', amount: -15, note: 'Remboursement' }])
    expect(csv).toContain('"-15"')
  })
})
