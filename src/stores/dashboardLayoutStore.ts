import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Layouts, WidgetConstraint } from '../types'

export const ALL_WIDGETS: string[] = ['hero', 'persons', 'quickLinks', 'streakBadges', 'savings', 'insights', 'smartTips', 'categories', 'trend', 'chargesDetail']

// Min/max constraints per widget
export const WIDGET_CONSTRAINTS: Record<string, WidgetConstraint> = {
  hero:         { minW: 2, maxW: 3, minH: 7, maxH: 12 },
  persons:      { minW: 2, maxW: 3, minH: 4, maxH: 10 },
  quickLinks:   { minW: 1, maxW: 3, minH: 2, maxH: 4 },
  streakBadges: { minW: 1, maxW: 2, minH: 3, maxH: 6 },
  savings:      { minW: 1, maxW: 2, minH: 3, maxH: 6 },
  insights:     { minW: 1, maxW: 2, minH: 3, maxH: 8 },
  smartTips:    { minW: 1, maxW: 2, minH: 3, maxH: 8 },
  trend:        { minW: 1, maxW: 3, minH: 5, maxH: 10 },
  categories:   { minW: 1, maxW: 3, minH: 4, maxH: 10 },
  chargesDetail:{ minW: 1, maxW: 3, minH: 4, maxH: 10 },
}

export const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 7, ...WIDGET_CONSTRAINTS.hero },
    { i: 'insights', x: 2, y: 0, w: 1, h: 4, ...WIDGET_CONSTRAINTS.insights },
    { i: 'streakBadges', x: 2, y: 4, w: 1, h: 3, ...WIDGET_CONSTRAINTS.streakBadges },
    { i: 'persons', x: 0, y: 7, w: 2, h: 5, ...WIDGET_CONSTRAINTS.persons },
    { i: 'savings', x: 2, y: 7, w: 1, h: 4, ...WIDGET_CONSTRAINTS.savings },
    { i: 'smartTips', x: 2, y: 11, w: 1, h: 5, ...WIDGET_CONSTRAINTS.smartTips },
    { i: 'trend', x: 2, y: 16, w: 1, h: 5, ...WIDGET_CONSTRAINTS.trend },
    { i: 'quickLinks', x: 0, y: 12, w: 2, h: 2, ...WIDGET_CONSTRAINTS.quickLinks },
  ],
  md: [
    { i: 'hero', x: 0, y: 0, w: 2, h: 7, ...WIDGET_CONSTRAINTS.hero },
    { i: 'persons', x: 0, y: 7, w: 2, h: 5, ...WIDGET_CONSTRAINTS.persons },
    { i: 'quickLinks', x: 0, y: 12, w: 2, h: 2, ...WIDGET_CONSTRAINTS.quickLinks },
    { i: 'streakBadges', x: 0, y: 14, w: 1, h: 4, ...WIDGET_CONSTRAINTS.streakBadges },
    { i: 'savings', x: 1, y: 14, w: 1, h: 4, ...WIDGET_CONSTRAINTS.savings },
    { i: 'insights', x: 0, y: 18, w: 1, h: 4, ...WIDGET_CONSTRAINTS.insights },
    { i: 'smartTips', x: 1, y: 18, w: 1, h: 5, ...WIDGET_CONSTRAINTS.smartTips },
    { i: 'trend', x: 0, y: 23, w: 1, h: 5, ...WIDGET_CONSTRAINTS.trend },
  ],
  sm: [
    { i: 'hero', x: 0, y: 0, w: 1, h: 6 },
    { i: 'persons', x: 0, y: 6, w: 1, h: 4 },
    { i: 'quickLinks', x: 0, y: 10, w: 1, h: 2 },
    { i: 'streakBadges', x: 0, y: 12, w: 1, h: 3 },
    { i: 'savings', x: 0, y: 15, w: 1, h: 2 },
    { i: 'insights', x: 0, y: 17, w: 1, h: 3 },
    { i: 'smartTips', x: 0, y: 20, w: 1, h: 4 },
    { i: 'categories', x: 0, y: 24, w: 1, h: 6 },
    { i: 'trend', x: 0, y: 30, w: 1, h: 5 },
    { i: 'chargesDetail', x: 0, y: 35, w: 1, h: 5 },
  ],
}

// One-time migration: clear stale layout from localStorage
const LAYOUT_VERSION_KEY = 'monest-dashboard-layout-v'
const CURRENT_LAYOUT_VERSION = 9
if (typeof window !== 'undefined' && localStorage.getItem(LAYOUT_VERSION_KEY) !== String(CURRENT_LAYOUT_VERSION)) {
  localStorage.removeItem('monest-dashboard-layout')
  localStorage.setItem(LAYOUT_VERSION_KEY, String(CURRENT_LAYOUT_VERSION))
}

// Debounce timer for saving layout to Supabase
let _saveTimer: ReturnType<typeof setTimeout> | null = null

interface DashboardLayoutState {
  layouts: Layouts
  isEditMode: boolean

  setLayouts: (layouts: Layouts) => void
  toggleEditMode: () => void
  resetLayouts: () => void
  saveToDB: (userId: string, householdId: string) => Promise<void>
  loadFromDB: (userId: string, householdId: string) => Promise<void>
  scheduleSaveToDB: (userId: string, householdId: string) => void
}

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set, get) => ({
      layouts: DEFAULT_LAYOUTS,
      isEditMode: false,
      setLayouts: (layouts: Layouts) => set({ layouts }),
      toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
      resetLayouts: () => set({ layouts: DEFAULT_LAYOUTS }),

      // Save layout to Supabase (debounced externally)
      saveToDB: async (userId: string, householdId: string): Promise<void> => {
        if (!isSupabaseConfigured() || !userId || !householdId) return
        const { layouts } = get()
        try {
          await supabase!.from('user_preferences').upsert(
            {
              user_id: userId,
              household_id: householdId,
              dashboard_layout: layouts,
              dashboard_layout_version: CURRENT_LAYOUT_VERSION,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,household_id' }
          )
        } catch (err) {
          console.error('Failed to save dashboard layout:', err)
        }
      },

      // Load layout from Supabase and merge with localStorage
      loadFromDB: async (userId: string, householdId: string): Promise<void> => {
        if (!isSupabaseConfigured() || !userId || !householdId) return
        try {
          const { data } = await supabase!
            .from('user_preferences')
            .select('dashboard_layout, dashboard_layout_version, updated_at')
            .eq('user_id', userId)
            .eq('household_id', householdId)
            .maybeSingle()

          // Only use DB layout if version matches — stale layouts are discarded
          if (data?.dashboard_layout && Object.keys(data.dashboard_layout as Record<string, unknown>).length > 0) {
            if (data.dashboard_layout_version === CURRENT_LAYOUT_VERSION) {
              set({ layouts: data.dashboard_layout as Layouts })
            } else {
              // DB layout is stale — overwrite with current defaults
              get().saveToDB(userId, householdId)
            }
          }
        } catch (err: unknown) {
          // No row found is fine — first time user, keep localStorage layout
          if ((err as { code?: string })?.code !== 'PGRST116') {
            console.error('Failed to load dashboard layout:', err)
          }
        }
      },

      // Schedule a debounced save to Supabase
      scheduleSaveToDB: (userId: string, householdId: string) => {
        if (_saveTimer) clearTimeout(_saveTimer)
        _saveTimer = setTimeout(() => {
          _saveTimer = null
          get().saveToDB(userId, householdId)
        }, 1000)
      },
    }),
    {
      name: 'monest-dashboard-layout',
      version: 9,
      migrate: (): DashboardLayoutState => {
        // Always reset to default layouts on version change
        return { layouts: DEFAULT_LAYOUTS, isEditMode: false } as DashboardLayoutState
      },
    }
  )
)
