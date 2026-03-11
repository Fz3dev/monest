// IndexedDB-backed queue for offline pending writes
// Ensures Supabase mutations survive page refreshes and offline periods

const DB_NAME = 'monest-offline'
const STORE_NAME = 'pending-writes'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function addPendingWrite(table, item) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `${table}:${item.id}`
    tx.objectStore(STORE_NAME).put({ key, table, item, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = resolve })
  } catch (err) {
    console.warn('IndexedDB addPendingWrite failed:', err)
  }
}

export async function removePendingWrite(key) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(key)
    return new Promise((resolve) => { tx.oncomplete = resolve })
  } catch (err) {
    console.warn('IndexedDB removePendingWrite failed:', err)
  }
}

export async function getAllPendingWrites() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    return new Promise((resolve) => { req.onsuccess = () => resolve(req.result || []) })
  } catch (err) {
    console.warn('IndexedDB getAllPendingWrites failed:', err)
    return []
  }
}

export async function addPendingDelete(table, id) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `delete:${table}:${id}`
    tx.objectStore(STORE_NAME).put({ key, table, id, isDelete: true, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = resolve })
  } catch (err) {
    console.warn('IndexedDB addPendingDelete failed:', err)
  }
}

export async function addPendingMonthlyWrite(month, entry) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const key = `monthly:${month}`
    tx.objectStore(STORE_NAME).put({ key, table: '__monthly__', item: { month, entry }, isMonthly: true, timestamp: Date.now() })
    return new Promise((resolve) => { tx.oncomplete = resolve })
  } catch (err) {
    console.warn('IndexedDB addPendingMonthlyWrite failed:', err)
  }
}
