// Global sync bridge — connects Zustand stores to Supabase
// Set once from useSupabaseSync, used by stores to auto-sync mutations

let _syncItem = null
let _deleteItem = null

export function setSyncFunctions(syncItem, deleteItem) {
  _syncItem = syncItem
  _deleteItem = deleteItem
}

export function syncToSupabase(table, item) {
  _syncItem?.(table, item)
}

export function deleteFromSupabase(table, id) {
  _deleteItem?.(table, id)
}
