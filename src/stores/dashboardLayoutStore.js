import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const ALL_WIDGETS = ['hero', 'persons', 'quickLinks', 'savings', 'insights', 'categories', 'trend', 'chargesDetail']

export const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 6 },
    { i: 'savings', x: 2, y: 0, w: 1, h: 3 },
    { i: 'insights', x: 2, y: 3, w: 1, h: 3 },
    { i: 'persons', x: 0, y: 6, w: 2, h: 4 },
    { i: 'categories', x: 2, y: 6, w: 1, h: 7 },
    { i: 'quickLinks', x: 0, y: 10, w: 2, h: 2 },
    { i: 'trend', x: 0, y: 12, w: 1, h: 5 },
    { i: 'chargesDetail', x: 1, y: 12, w: 2, h: 5 },
  ],
  md: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 6 },
    { i: 'persons', x: 0, y: 6, w: 2, h: 4 },
    { i: 'quickLinks', x: 0, y: 10, w: 2, h: 2 },
    { i: 'savings', x: 0, y: 12, w: 1, h: 3 },
    { i: 'insights', x: 1, y: 12, w: 1, h: 3 },
    { i: 'categories', x: 0, y: 15, w: 1, h: 7 },
    { i: 'trend', x: 1, y: 15, w: 1, h: 5 },
    { i: 'chargesDetail', x: 0, y: 22, w: 2, h: 5 },
  ],
  sm: [
    { i: 'hero', x: 0, y: 0, w: 1, h: 7 },
    { i: 'persons', x: 0, y: 7, w: 1, h: 5 },
    { i: 'quickLinks', x: 0, y: 12, w: 1, h: 3 },
    { i: 'savings', x: 0, y: 15, w: 1, h: 3 },
    { i: 'insights', x: 0, y: 18, w: 1, h: 3 },
    { i: 'categories', x: 0, y: 21, w: 1, h: 7 },
    { i: 'trend', x: 0, y: 28, w: 1, h: 5 },
    { i: 'chargesDetail', x: 0, y: 33, w: 1, h: 5 },
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
    { name: 'monest-dashboard-layout', version: 1 }
  )
)
