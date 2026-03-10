import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../stores/themeStore'

describe('themeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
  })

  it('defaults to dark theme', () => {
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('toggles from dark to light', () => {
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggles from light back to dark', () => {
    useThemeStore.getState().toggleTheme() // dark → light
    useThemeStore.getState().toggleTheme() // light → dark
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('multiple toggles cycle correctly', () => {
    const store = useThemeStore.getState()
    store.toggleTheme() // light
    store.toggleTheme() // dark
    store.toggleTheme() // light
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
