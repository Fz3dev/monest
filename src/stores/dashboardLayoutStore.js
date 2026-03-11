import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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

// Debounce timer for saving layout to Supabase
let _saveTimer = null

export const useDashboardLayoutStore = create(
  persist(
    (set, get) => ({
      layouts: DEFAULT_LAYOUTS,
      isEditMode: false,
      setLayouts: (layouts) => set({ layouts }),
      toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),

      // Save layout to Supabase (debounced externally)
      saveToDB: async (userId, householdId) => {
        if (!isSupabaseConfigured() || !userId || !householdId) return
        const { layouts } = get()
        try {
          await supabase.from('user_preferences').upsert(
            {
              user_id: userId,
              household_id: householdId,
              dashboard_layout: layouts,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,household_id' }
          )
        } catch (err) {
          console.error('Failed to save dashboard layout:', err)
        }
      },

      // Load layout from Supabase and merge with localStorage
      loadFromDB: async (userId, householdId) => {
        if (!isSupabaseConfigured() || !userId || !householdId) return
        try {
          const { data } = await supabase
            .from('user_preferences')
            .select('dashboard_layout, updated_at')
            .eq('user_id', userId)
            .eq('household_id', householdId)
            .single()

          if (data?.dashboard_layout && Object.keys(data.dashboard_layout).length > 0) {
            // Use DB layout — it's the cross-device source of truth
            set({ layouts: data.dashboard_layout })
          }
        } catch (err) {
          // No row found is fine — first time user, keep localStorage layout
          if (err?.code !== 'PGRST116') {
            console.error('Failed to load dashboard layout:', err)
          }
        }
      },

      // Schedule a debounced save to Supabase
      scheduleSaveToDB: (userId, householdId) => {
        if (_saveTimer) clearTimeout(_saveTimer)
        _saveTimer = setTimeout(() => {
          _saveTimer = null
          get().saveToDB(userId, householdId)
        }, 1000)
      },
    }),
    { name: 'monest-dashboard-layout', version: 2 }
  )
)
