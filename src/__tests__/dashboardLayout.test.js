import { describe, it, expect } from 'vitest'
import { DEFAULT_LAYOUTS, WIDGET_CONSTRAINTS, ALL_WIDGETS } from '../stores/dashboardLayoutStore'

describe('dashboardLayoutStore', () => {
  describe('DEFAULT_LAYOUTS', () => {
    it('has lg, md, and sm breakpoints', () => {
      expect(DEFAULT_LAYOUTS).toHaveProperty('lg')
      expect(DEFAULT_LAYOUTS).toHaveProperty('md')
      expect(DEFAULT_LAYOUTS).toHaveProperty('sm')
    })

    it('lg layout has all non-flow grid widgets', () => {
      const lgIds = DEFAULT_LAYOUTS.lg.map((l) => l.i)
      // categories and chargesDetail are flow widgets (not in grid)
      const gridWidgets = ALL_WIDGETS.filter((w) => w !== 'categories' && w !== 'chargesDetail')
      for (const w of gridWidgets) {
        expect(lgIds).toContain(w)
      }
    })

    it('md layout has all non-flow grid widgets', () => {
      const mdIds = DEFAULT_LAYOUTS.md.map((l) => l.i)
      const gridWidgets = ALL_WIDGETS.filter((w) => w !== 'categories' && w !== 'chargesDetail')
      for (const w of gridWidgets) {
        expect(mdIds).toContain(w)
      }
    })

    it('lg layout uses 3 columns (max x + w <= 3)', () => {
      for (const item of DEFAULT_LAYOUTS.lg) {
        expect(item.x + item.w).toBeLessThanOrEqual(3)
      }
    })

    it('md layout uses 2 columns (max x + w <= 2)', () => {
      for (const item of DEFAULT_LAYOUTS.md) {
        expect(item.x + item.w).toBeLessThanOrEqual(2)
      }
    })
  })

  describe('WIDGET_CONSTRAINTS', () => {
    it('has constraints for all grid widgets', () => {
      const gridWidgets = ALL_WIDGETS.filter((w) => w !== 'categories' && w !== 'chargesDetail')
      for (const w of gridWidgets) {
        expect(WIDGET_CONSTRAINTS).toHaveProperty(w)
        expect(WIDGET_CONSTRAINTS[w]).toHaveProperty('minW')
        expect(WIDGET_CONSTRAINTS[w]).toHaveProperty('minH')
        expect(WIDGET_CONSTRAINTS[w]).toHaveProperty('maxW')
        expect(WIDGET_CONSTRAINTS[w]).toHaveProperty('maxH')
      }
    })

    it('minW <= maxW and minH <= maxH for all widgets', () => {
      for (const [, c] of Object.entries(WIDGET_CONSTRAINTS)) {
        expect(c.minW).toBeLessThanOrEqual(c.maxW)
        expect(c.minH).toBeLessThanOrEqual(c.maxH)
      }
    })

    it('lg default heights respect constraints', () => {
      for (const item of DEFAULT_LAYOUTS.lg) {
        const c = WIDGET_CONSTRAINTS[item.i]
        if (c) {
          expect(item.h).toBeGreaterThanOrEqual(c.minH)
          expect(item.h).toBeLessThanOrEqual(c.maxH)
          expect(item.w).toBeGreaterThanOrEqual(c.minW)
          expect(item.w).toBeLessThanOrEqual(c.maxW)
        }
      }
    })

    it('md default heights respect constraints', () => {
      for (const item of DEFAULT_LAYOUTS.md) {
        const c = WIDGET_CONSTRAINTS[item.i]
        if (c) {
          expect(item.h).toBeGreaterThanOrEqual(c.minH)
          expect(item.h).toBeLessThanOrEqual(c.maxH)
          expect(item.w).toBeGreaterThanOrEqual(c.minW)
          expect(item.w).toBeLessThanOrEqual(c.maxW)
        }
      }
    })
  })

  describe('layout no overlaps', () => {
    function checkNoOverlaps(layout) {
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const a = layout[i]
          const b = layout[j]
          // Check if two items occupy the same cell
          const xOverlap = a.x < b.x + b.w && a.x + a.w > b.x
          const yOverlap = a.y < b.y + b.h && a.y + a.h > b.y
          if (xOverlap && yOverlap) {
            return { overlap: true, a: a.i, b: b.i }
          }
        }
      }
      return { overlap: false }
    }

    it('lg layout has no overlapping widgets', () => {
      const result = checkNoOverlaps(DEFAULT_LAYOUTS.lg)
      expect(result.overlap).toBe(false)
    })

    it('md layout has no overlapping widgets', () => {
      const result = checkNoOverlaps(DEFAULT_LAYOUTS.md)
      expect(result.overlap).toBe(false)
    })

    it('sm layout has no overlapping widgets', () => {
      const result = checkNoOverlaps(DEFAULT_LAYOUTS.sm)
      expect(result.overlap).toBe(false)
    })
  })

  describe('sm layout', () => {
    it('sm layout uses 1 column (max x + w <= 1)', () => {
      for (const item of DEFAULT_LAYOUTS.sm) {
        expect(item.x + item.w).toBeLessThanOrEqual(1)
      }
    })

    it('sm layout has all widgets including flow widgets', () => {
      const smIds = DEFAULT_LAYOUTS.sm.map((l) => l.i)
      for (const w of ALL_WIDGETS) {
        expect(smIds).toContain(w)
      }
    })

    it('sm layout items have sequential y positions (no gaps)', () => {
      const sorted = [...DEFAULT_LAYOUTS.sm].sort((a, b) => a.y - b.y)
      for (let i = 1; i < sorted.length; i++) {
        // Next item starts where previous ends
        expect(sorted[i].y).toBe(sorted[i - 1].y + sorted[i - 1].h)
      }
    })
  })
})
