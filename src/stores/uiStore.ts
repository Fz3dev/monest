import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  confidentialMode: boolean
  toggleConfidentialMode: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      confidentialMode: false,
      toggleConfidentialMode: () => set((s) => ({ confidentialMode: !s.confidentialMode })),
    }),
    { name: 'monest-ui' }
  )
)
