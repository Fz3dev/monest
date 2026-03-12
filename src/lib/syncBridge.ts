// Global sync bridge — connects Zustand stores to Supabase
// Set once from useSupabaseSync, used by stores to auto-sync mutations

import { toast } from 'sonner'
import { createNotification } from './notifications'
import {
  addPendingWrite,
  removePendingWrite,
  getAllPendingWrites,
  addPendingDelete,
  addPendingMonthlyWrite,
} from './offlineQueue'
import type { PendingEntry } from './offlineQueue'

// ─── Sync function types ────────────────────────────────────────────────────

// Accepts any plain object — domain types (FixedCharge, Expense, etc.) satisfy
// this constraint without needing `as unknown as Record<string, unknown>` casts.
type Syncable = Record<string, unknown>

type SyncItemFn = (table: string, item: Syncable) => Promise<void>
type DeleteItemFn = (table: string, id: string) => Promise<void>
type SyncMonthlyEntryFn = (month: string, entry: Syncable, changedFields?: Set<string> | null) => Promise<void>

let _syncItem: SyncItemFn | null = null
let _deleteItem: DeleteItemFn | null = null
let _syncMonthlyEntry: SyncMonthlyEntryFn | null = null

// User info for notifications
let _userId: string | null = null
let _userName: string | null = null
let _householdId: string | null = null

export function setSyncFunctions(
  syncItem: SyncItemFn,
  deleteItem: DeleteItemFn,
  syncMonthlyEntry?: SyncMonthlyEntryFn | null,
): void {
  _syncItem = syncItem
  _deleteItem = deleteItem
  _syncMonthlyEntry = syncMonthlyEntry || null
}

export function setUserInfo(userId: string, userName: string, householdId: string): void {
  _userId = userId
  _userName = userName
  _householdId = householdId
}

export function getUserInfo() {
  return { userId: _userId, userName: _userName, householdId: _householdId }
}

// ─── Retry helper ────────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch {
    // Retry once after 1 second
    await new Promise((r) => setTimeout(r, 1000))
    return await fn()
  }
}

// ─── Debounce map: collects writes per table:id, flushes after 300ms ─────────

interface PendingWriteEntry {
  table: string
  item: Record<string, unknown>
  changedFields?: Set<string>
}

const _pendingWrites = new Map<string, PendingWriteEntry>()
const _pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function flushWrite(key: string): void {
  const pending = _pendingWrites.get(key)
  _pendingTimers.delete(key)
  _pendingWrites.delete(key)
  if (!pending || !_syncItem) return
  executeSyncToSupabase(pending.table, pending.item).then((ok) => {
    if (ok) removePendingWrite(key)
  })
}

function debouncedSync(table: string, item: Record<string, unknown>): void {
  if (!_syncItem) return
  const key = `${table}:${item.id}`
  _pendingWrites.set(key, { table, item })

  // Persist to IndexedDB so it survives page refresh
  addPendingWrite(table, item)

  // Clear existing timer for this key
  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  // Flush after 300ms of inactivity
  const timer = setTimeout(() => flushWrite(key), 300)
  _pendingTimers.set(key, timer)
}

// ─── Core sync with error handling ───────────────────────────────────────────

async function executeSyncToSupabase(table: string, item: Record<string, unknown>): Promise<boolean> {
  if (!_syncItem) return false
  try {
    await withRetry(() => _syncItem!(table, item))
    // Fire notification for partner
    notifyForSync(table, item)
    return true
  } catch (err) {
    console.error(`Sync error (${table}):`, err)
    toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    return false
  }
}

async function executeDeleteFromSupabase(table: string, id: string): Promise<boolean> {
  if (!_deleteItem) return false
  try {
    await withRetry(() => _deleteItem!(table, id))
    return true
  } catch (err) {
    console.error(`Delete error (${table}):`, err)
    toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    return false
  }
}

// ─── Notification helpers ───────────────────────────────────────────────────

const TABLE_LABELS: Record<string, string> = {
  fixed_charges: 'charge',
  installment_payments: 'echeance',
  planned_expenses: 'depense prevue',
  expenses: 'depense',
  savings_goals: 'objectif epargne',
}

function notifyForSync(table: string, item: Record<string, unknown>): void {
  if (!_userId || !_householdId) return
  const label = TABLE_LABELS[table]
  if (!label) return

  const name = (item.name || item.label || item.description || '') as string
  const amount = item.amount ? `${item.amount}\u20AC ` : ''
  const title = `${_userName || 'Quelqu\'un'} a modifie un(e) ${label}`
  const body = amount || name ? `${amount}${name}`.trim() : null

  createNotification({
    householdId: _householdId,
    actorId: _userId,
    type: table === 'expenses' ? 'expense_added' : 'charge_updated',
    title,
    body,
    metadata: { table, itemId: item.id as string },
  })
}

function notifyForDelete(table: string, id: string): void {
  if (!_userId || !_householdId) return
  const label = TABLE_LABELS[table]
  if (!label) return

  createNotification({
    householdId: _householdId,
    actorId: _userId,
    type: 'charge_deleted',
    title: `${_userName || 'Quelqu\'un'} a supprime un(e) ${label}`,
    metadata: { table, itemId: id },
  })
}

function notifyForMonthly(month: string): void {
  if (!_userId || !_householdId) return

  // Format month label (e.g. "2026-03" -> "Mars 2026")
  const MONTHS = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre']
  const [year, m] = month.split('-')
  const monthLabel = `${MONTHS[parseInt(m, 10) - 1] || m} ${year}`

  createNotification({
    householdId: _householdId,
    actorId: _userId,
    type: 'salary_updated',
    title: `${_userName || 'Quelqu\'un'} a mis a jour les revenus`,
    body: monthLabel,
    metadata: { month },
  })
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function syncToSupabase<T extends object>(table: string, item: T): void {
  debouncedSync(table, item as Syncable)
}

export function deleteFromSupabase(table: string, id: string): void {
  // Deletes flush immediately — can't debounce a delete
  // Also cancel any pending write for this item
  const key = `${table}:${id}`
  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
    _pendingTimers.delete(key)
    _pendingWrites.delete(key)
  }
  // Remove any pending write from IndexedDB & persist the delete
  removePendingWrite(key)
  addPendingDelete(table, id)
  executeDeleteFromSupabase(table, id).then((ok) => {
    if (ok) removePendingWrite(`delete:${table}:${id}`)
  })
  notifyForDelete(table, id)
}

// ─── Category rules sync (pattern-based, not id-based) ──────────────────────

export function syncCategoryRule(pattern: string, category: string): void {
  if (!_syncItem) return
  // category_rules use pattern as the logical key, but need an id for Supabase
  // Generate a deterministic id from the pattern to allow upsert
  const id = `rule-${pattern.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
  debouncedSync('category_rules', { id, pattern: pattern.toUpperCase(), category })
}

// ─── Monthly entries sync (composite key: household_id + month) ──────────────

export function syncMonthlyEntryToSupabase<T extends object>(
  month: string,
  entry: T,
  changedFields: string[] | null = null,
): void {
  if (!_syncMonthlyEntry) return
  const key = `monthly:${month}`

  // Accumulate changed fields across debounce window
  const existing = _pendingWrites.get(key)
  const accumulatedFields = new Set<string>([
    ...(existing?.changedFields || []),
    ...(changedFields || []),
  ])

  _pendingWrites.set(key, { table: '__monthly__', item: { month, entry } as Syncable, changedFields: accumulatedFields })

  // Persist to IndexedDB so it survives page refresh
  addPendingMonthlyWrite(month, entry as Syncable)

  const existingTimer = _pendingTimers.get(key)
  if (existingTimer) clearTimeout(existingTimer)

  const timer = setTimeout(async () => {
    const pending = _pendingWrites.get(key)
    _pendingTimers.delete(key)
    _pendingWrites.delete(key)
    if (!pending || !_syncMonthlyEntry) return
    try {
      const pendingItem = pending.item as { month: string; entry: Record<string, unknown> }
      await withRetry(() => _syncMonthlyEntry!(pendingItem.month, pendingItem.entry, pending.changedFields))
      notifyForMonthly(pendingItem.month)
      removePendingWrite(key)
    } catch (err) {
      console.error('Monthly sync error:', err)
      toast.error('Erreur de sync — vos modifications pourraient ne pas etre sauvegardees')
    }
  }, 300)
  _pendingTimers.set(key, timer)
}

export function deleteCategoryRule(pattern: string): void {
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

// ─── Offline queue flush ────────────────────────────────────────────────────

export async function flushOfflineQueue(): Promise<number> {
  if (!_syncItem && !_deleteItem && !_syncMonthlyEntry) return 0

  let flushed = 0
  let pending: PendingEntry[]
  try {
    pending = await getAllPendingWrites()
  } catch {
    return 0
  }
  if (!pending.length) return 0

  // Sort by timestamp to replay in order
  pending.sort((a, b) => a.timestamp - b.timestamp)

  // Discard entries older than 7 days
  const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
  const now = Date.now()
  const validPending = pending.filter((entry) => {
    if (now - entry.timestamp > MAX_AGE_MS) {
      removePendingWrite(entry.key).catch(() => {})
      return false
    }
    return true
  })

  for (const entry of validPending) {
    try {
      if ('isMonthly' in entry && entry.isMonthly && _syncMonthlyEntry) {
        // Monthly entry
        const item = entry.item as { month: string; entry: Record<string, unknown> }
        await withRetry(() => _syncMonthlyEntry!(item.month, item.entry))
        await removePendingWrite(entry.key)
        flushed++
      } else if ('isDelete' in entry && entry.isDelete && _deleteItem) {
        // Delete operation
        await withRetry(() => _deleteItem!(entry.table, (entry as { id: string }).id))
        await removePendingWrite(entry.key)
        flushed++
      } else if (!('isDelete' in entry && entry.isDelete) && !('isMonthly' in entry && entry.isMonthly) && _syncItem) {
        // Regular upsert
        const item = (entry as { item: Record<string, unknown> }).item
        await withRetry(() => _syncItem!(entry.table, item))
        await removePendingWrite(entry.key)
        flushed++
      }
    } catch (err) {
      console.error(`Offline queue flush error for ${entry.key}:`, err)
      // Leave in queue for next attempt
    }
  }

  return flushed
}
