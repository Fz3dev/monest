import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_CATEGORIES = {
  logement: { color: '#6C63FF', emoji: '\u{1F3E0}' },
  assurance: { color: '#818CF8', emoji: '\u{1F6E1}\uFE0F' },
  credit: { color: '#F87171', emoji: '\u{1F4B3}' },
  abonnement: { color: '#38BDF8', emoji: '\u{1F4F1}' },
  impot: { color: '#FBBF24', emoji: '\u{1F4CB}' },
  transport: { color: '#FB923C', emoji: '\u26FD' },
  alimentation: { color: '#4ADE80', emoji: '\u{1F6D2}' },
  sante: { color: '#F472B6', emoji: '\u{1F3E5}' },
  education: { color: '#A78BFA', emoji: '\u{1F393}' },
  loisirs: { color: '#34D399', emoji: '\u{1F3AE}' },
  enfants: { color: '#E879F9', emoji: '\u{1F476}' },
  autre: { color: '#94A3B8', emoji: '\u{1F381}' },
}

export const useCategoriesStore = create(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,

      getCategoryColor: (key) => {
        return get().categories[key]?.color || '#94A3B8'
      },

      getCategoryEmoji: (key) => {
        return get().categories[key]?.emoji || '\u{1F381}'
      },

      updateCategoryColor: (key, color) =>
        set((s) => ({
          categories: {
            ...s.categories,
            [key]: { ...s.categories[key], color },
          },
        })),

      addCategory: (key, color = '#94A3B8', emoji = '\u{1F381}') =>
        set((s) => ({
          categories: {
            ...s.categories,
            [key]: { color, emoji },
          },
        })),

      removeCategory: (key) =>
        set((s) => {
          const { [key]: _, ...rest } = s.categories
          return { categories: rest }
        }),

      resetCategories: () => set({ categories: DEFAULT_CATEGORIES }),
    }),
    { name: 'monest-categories', version: 1 }
  )
)
