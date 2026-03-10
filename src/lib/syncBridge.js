// Global sync bridge — connects Zustand stores to Supabase
// Set once from useSupabaseSync, used by stores to auto-sync mutations

import { toast } from 'sonner'

let _syncItem = null
let _deleteItem = null
let _syncMonthlyEntry = null

export function setSyncFunctions(syncItem, deleteItem, syncMonthlyEntry) {
  _syncItem = syncItem
  _deleteItem = deleteItem
  _syncMonthlyEntry = syncMonthlyEntry || null
}

// ─── Retry helper ────────────────────────────────────────────────────────────

async function withRetry(fn) {
  try {
    return await fn()
  } catch {
    // Retry once after 1 second
    await new Promise((r) => setTimeout(r, 1000))
    return await fn()
  }
}

// ─── Debounce map: collects writes per table:id, flushes after 300ms ─────────

const _pendingWrites = new Map()
const _pendingTimers = new Map()

function flushWrite(key) {
  const pending = _pendingWrites.get(key)
  _pendingTimers.delete(key)
  _pendingWrites.delete(key)
  if (!pending || !_syncItem) return
  executeSyncToSupabase(pending.table, pending.item)
}

function debouncedSync(table, item) {
  if (!_syncItem) return
  const key = `${table}:${item.id}`
  _pendingWrites.set(key, { table, item })

  // Clear existing timer for this key
  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  // Flush after 300ms of inactivity
  const timer = setTimeout(() => flushWrite(key), 300)
  _pendingTimers.set(key, timer)
}

// ─── Core sync with error handling ───────────────────────────────────────────

async function executeSyncToSupabase(table, item) {
  if (!_syncItem) return false
  try {
    await withRetry(() => _syncItem(table, item))
    return true
  } catch (err) {
    console.error(`Sync error (${table}):`, err)
    toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    return false
  }
}

async function executeDeleteFromSupabase(table, id) {
  if (!_deleteItem) return false
  try {
    await withRetry(() => _deleteItem(table, id))
    return true
  } catch (err) {
    console.error(`Delete error (${table}):`, err)
    toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    return false
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function syncToSupabase(table, item) {
  debouncedSync(table, item)
}

export function deleteFromSupabase(table, id) {
  // Deletes flush immediately — can't debounce a delete
  // Also cancel any pending write for this item
  const key = `${table}:${id}`
  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
    _pendingTimers.delete(key)
    _pendingWrites.delete(key)
  }
  executeDeleteFromSupabase(table, id)
}

// ─── Category rules sync (pattern-based, not id-based) ──────────────────────

export function syncCategoryRule(pattern, category) {
  if (!_syncItem) return
  // category_rules use pattern as the logical key, but need an id for Supabase
  // Generate a deterministic id from the pattern to allow upsert
  const id = `rule-${pattern.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
  debouncedSync('category_rules', { id, pattern: pattern.toUpperCase(), category })
}

// ─── Monthly entries sync (composite key: household_id + month) ──────────────

export function syncMonthlyEntryToSupabase(month, entry) {
  if (!_syncMonthlyEntry) return
  const key = `monthly:${month}`
  _pendingWrites.set(key, { table: '__monthly__', item: { month, entry } })

  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  const timer = setTimeout(async () => {
    const pending = _pendingWrites.get(key)
    _pendingTimers.delete(key)
    _pendingWrites.delete(key)
    if (!pending || !_syncMonthlyEntry) return
    try {
      await withRetry(() => _syncMonthlyEntry(pending.item.month, pending.item.entry))
    } catch (err) {
      console.error('Monthly sync error:', err)
      toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    }
  }, 300)
  _pendingTimers.set(key, timer)
}

export function deleteCategoryRule(pattern) {
  if (!_deleteItem) return
  const id = `rule-${pattern.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
  // Cancel any pending write for this rule
  const key = `category_rules:${id}`
  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
    _pendingTimers.delete(key)
    _pendingWrites.delete(key)
  }
  executeDeleteFromSupabase('category_rules', id)
}
