import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const ALL_WIDGETS = ['hero', 'persons', 'quickLinks', 'savings', 'insights', 'categories', 'trend', 'chargesDetail']

export const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 5 },
    { i: 'savings', x: 2, y: 0, w: 1, h: 2 },
    { i: 'insights', x: 2, y: 2, w: 1, h: 3 },
    { i: 'persons', x: 0, y: 5, w: 2, h: 3 },
    { i: 'categories', x: 2, y: 5, w: 1, h: 6 },
    { i: 'quickLinks', x: 0, y: 8, w: 2, h: 2 },
    { i: 'trend', x: 0, y: 10, w: 1, h: 5 },
    { i: 'chargesDetail', x: 1, y: 10, w: 2, h: 5 },
  ],
  md: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 5 },
    { i: 'persons', x: 0, y: 5, w: 2, h: 3 },
    { i: 'quickLinks', x: 0, y: 8, w: 2, h: 2 },
    { i: 'savings', x: 0, y: 10, w: 1, h: 2 },
    { i: 'insights', x: 1, y: 10, w: 1, h: 3 },
    { i: 'categories', x: 0, y: 13, w: 1, h: 6 },
    { i: 'trend', x: 1, y: 13, w: 1, h: 5 },
    { i: 'chargesDetail', x: 0, y: 19, w: 2, h: 5 },
  ],
  sm: [
    { i: 'hero', x: 0, y: 0, w: 1, h: 6 },
    { i: 'persons', x: 0, y: 6, w: 1, h: 4 },
    { i: 'quickLinks', x: 0, y: 10, w: 1, h: 2 },
    { i: 'savings', x: 0, y: 12, w: 1, h: 2 },
    { i: 'insights', x: 0, y: 14, w: 1, h: 3 },
    { i: 'categories', x: 0, y: 17, w: 1, h: 6 },
    { i: 'trend', x: 0, y: 23, w: 1, h: 5 },
    { i: 'chargesDetail', x: 0, y: 28, w: 1, h: 5 },
  ],
}

export const useDashboardLayoutStore = create(
  persist(
    (set) => ({
      layouts: DEFAULT_LAYOUTS,
      isEditMode: false,
      setLayouts: (layouts) => set({ layouts }),
      toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),
    }),
    { name: 'monest-dashboard-layout', version: 2 }
  )
)
