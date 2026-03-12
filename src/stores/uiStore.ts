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

// Sync confidential class on <body> whenever state changes (incl. rehydration)
useUiStore.subscribe((s) => {
  document.body.classList.toggle('confidential', s.confidentialMode)
})
// Apply on initial load (persist rehydrates asynchronously)
if (useUiStore.getState().confidentialMode) {
  document.body.classList.add('confidential')
}
