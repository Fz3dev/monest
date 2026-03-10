// Global sync bridge — connects Zustand stores to Supabase
// Set once from useSupabaseSync, used by stores to auto-sync mutations

let _syncItem = null
let _deleteItem = null
let _syncMonthlyEntry = null
let _monthlyDebounceTimer = null

export function setSyncFunctions(syncItem, deleteItem, syncMonthlyEntry) {
  _syncItem = syncItem
  _deleteItem = deleteItem
  _syncMonthlyEntry = syncMonthlyEntry
}

export function syncToSupabase(table, item) {
  _syncItem?.(table, item)
}

export function deleteFromSupabase(table, id) {
  _deleteItem?.(table, id)
}

// Debounced sync for monthly entries (user types fast in income fields)
export function syncMonthlyEntryToSupabase(month, entry) {
  if (!_syncMonthlyEntry) return
  clearTimeout(_monthlyDebounceTimer)
  _monthlyDebounceTimer = setTimeout(() => {
    _syncMonthlyEntry(month, entry)
  }, 800)
}
