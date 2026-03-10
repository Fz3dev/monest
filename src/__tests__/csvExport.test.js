import { describe, it, expect } from 'vitest'

// Test the CSV export logic extracted from SettingsPage
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
  it('generates correct header', () => {
    const csv = generateCSV([])
    expect(csv).toBe('"Date","Categorie","Note","Montant","Paye par"')
  })

  it('includes expense data', () => {
    const csv = generateCSV([
      { date: '2026-03-10', category: 'alimentation', note: 'Courses', amount: 45, payer: 'common' },
    ])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[1]).toBe('"2026-03-10","alimentation","Courses","45","common"')
  })

  it('handles multiple expenses', () => {
    const csv = generateCSV([
      { date: '2026-03-10', amount: 10, category: 'a', payer: 'common' },
      { date: '2026-03-11', amount: 20, category: 'b', payer: 'person_a' },
    ])
    expect(csv.split('\n')).toHaveLength(3)
  })

  it('escapes double quotes in notes', () => {
    const csv = generateCSV([
      { date: '2026-03-10', amount: 10, note: 'Said "hello"', category: 'autre', payer: '' },
    ])
    expect(csv).toContain('Said ""hello""')
  })

  it('handles missing fields gracefully', () => {
    const csv = generateCSV([{ amount: 25 }])
    const lines = csv.split('\n')
    expect(lines[1]).toBe('"","","","25",""')
  })

  it('handles zero amounts', () => {
    const csv = generateCSV([{ date: '2026-03-10', amount: 0, category: 'autre', payer: '' }])
    expect(csv).toContain('"0"')
  })

  it('handles empty note', () => {
    const csv = generateCSV([{ date: '2026-03-10', amount: 10, note: '', category: 'autre', payer: '' }])
    const lines = csv.split('\n')
    expect(lines[1]).toContain('""')
  })
})
