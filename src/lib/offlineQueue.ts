// IndexedDB-backed queue for offline pending writes
// Ensures Supabase mutations survive page refreshes and offline periods

export interface PendingWrite {
  key: string
  table: string
  item: Record<string, unknown>
  timestamp: number
  isDelete?: false
  isMonthly?: false
}

export interface PendingDelete {
  key: string
  table: string
  id: string
  isDelete: true
  timestamp: number
}

export interface PendingMonthlyWrite {
  key: string
  table: '__monthly__'
  item: { month: string; entry: Record<string, unknown> }
  isMonthly: true
  timestamp: number
}

export type PendingEntry = PendingWrite | PendingDelete | PendingMonthlyWrite

const DB_NAME = 'monest-offline'
const STORE_NAME = 'pending-writes'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req: IDBOpenDBRequest = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function addPendingWrite(table: string, item: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `${table}:${item.id}`
    tx.objectStore(STORE_NAME).put({ key, table, item, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = () => resolve() })
  } catch (err) {
    console.warn('IndexedDB addPendingWrite failed:', err)
  }
}

export async function removePendingWrite(key: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    return new Promise((resolve) => { tx.oncomplete = () => resolve() })
  } catch (err) {
    console.warn('IndexedDB removePendingWrite failed:', err)
  }
}

export async function getAllPendingWrites(): Promise<PendingEntry[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req: IDBRequest<PendingEntry[]> = tx.objectStore(STORE_NAME).getAll()
    return new Promise((resolve) => { req.onsuccess = () => resolve(req.result || []) })
  } catch (err) {
    console.warn('IndexedDB getAllPendingWrites failed:', err)
    return []
  }
}

export async function addPendingDelete(table: string, id: string): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `delete:${table}:${id}`
    tx.objectStore(STORE_NAME).put({ key, table, id, isDelete: true, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = () => resolve() })
  } catch (err) {
    console.warn('IndexedDB addPendingDelete failed:', err)
  }
}

export async function addPendingMonthlyWrite(month: string, entry: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `monthly:${month}`
    tx.objectStore(STORE_NAME).put({ key, table: '__monthly__', item: { month, entry }, isMonthly: true, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = () => resolve() })
  } catch (err) {
    console.warn('IndexedDB addPendingMonthlyWrite failed:', err)
  }
}
