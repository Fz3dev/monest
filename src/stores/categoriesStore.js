import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_CATEGORIES = {
  logement: { color: '#3B82F6', emoji: '\u{1F3E0}' },       // bleu — maison, stabilité
  assurance: { color: '#14B8A6', emoji: '\u{1F6E1}\uFE0F' }, // teal — protection
  credit: { color: '#EF4444', emoji: '\u{1F4B3}' },          // rouge — dette, attention
  abonnement: { color: '#8B5CF6', emoji: '\u{1F4F1}' },      // violet — digital
  impot: { color: '#EAB308', emoji: '\u{1F4CB}' },           // jaune — officiel
  transport: { color: '#F97316', emoji: '\u26FD' },           // orange — mouvement
  alimentation: { color: '#84CC16', emoji: '\u{1F6D2}' },    // lime — frais, nourriture
  sante: { color: '#22C55E', emoji: '\u{1F3E5}' },           // vert — croix pharmacie
  education: { color: '#06B6D4', emoji: '\u{1F393}' },       // cyan — savoir
  loisirs: { color: '#EC4899', emoji: '\u{1F3AE}' },         // rose — fun
  enfants: { color: '#D946EF', emoji: '\u{1F476}' },         // fuchsia — enfance
  banque: { color: '#64748B', emoji: '\u{1F3E6}' },          // ardoise — institutionnel
  autre: { color: '#94A3B8', emoji: '\u{1F381}' },           // gris — neutre
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
    {
      name: 'monest-categories',
      version: 1,
      migrate: (state) => state,
    }
  )
)
