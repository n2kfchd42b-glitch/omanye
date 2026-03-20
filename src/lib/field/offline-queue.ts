// ── Omanye Field Offline Queue ────────────────────────────────────────────────
// IndexedDB-backed queue for field submissions captured while offline.
// Runs entirely client-side; no server dependency.
//
// Schema:
//   DB name : omanye-field-queue
//   Version : 1
//   Store   : submissions  (keyPath: 'id')
// ─────────────────────────────────────────────────────────────────────────────

import type { QueuedSubmission } from '@/types/field'

const DB_NAME    = 'omanye-field-queue'
const DB_VERSION = 1
const STORE      = 'submissions'

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('queuedAt', 'queuedAt', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

function tx(
  db:   IDBDatabase,
  mode: IDBTransactionMode,
  fn:   (store: IDBObjectStore) => IDBRequest,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const store       = transaction.objectStore(STORE)
    const req         = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Add a submission to the offline queue. */
export async function enqueue(submission: QueuedSubmission): Promise<void> {
  const db = await openDB()
  await tx(db, 'readwrite', (s) => s.put(submission))
  db.close()
}

/** Return all queued submissions ordered by queuedAt ascending. */
export async function getQueue(): Promise<QueuedSubmission[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const store       = transaction.objectStore(STORE)
    const index       = store.index('queuedAt')
    const req         = index.getAll()
    req.onsuccess = () => { db.close(); resolve(req.result as QueuedSubmission[]) }
    req.onerror   = () => { db.close(); reject(req.error) }
  })
}

/** Remove a successfully synced submission by its client id. */
export async function dequeue(id: string): Promise<void> {
  const db = await openDB()
  await tx(db, 'readwrite', (s) => s.delete(id))
  db.close()
}

/** Increment the fail counter on a submission (for backoff / abandonment). */
export async function incrementFailCount(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    const store       = transaction.objectStore(STORE)
    const getReq      = store.get(id)

    getReq.onsuccess = () => {
      const item = getReq.result as QueuedSubmission | undefined
      if (!item) { db.close(); resolve(); return }
      const putReq = store.put({ ...item, failCount: (item.failCount ?? 0) + 1 })
      putReq.onsuccess = () => { db.close(); resolve() }
      putReq.onerror   = () => { db.close(); reject(putReq.error) }
    }
    getReq.onerror = () => { db.close(); reject(getReq.error) }
  })
}

/** Return the number of items currently in the queue. */
export async function queueCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly')
    const store       = transaction.objectStore(STORE)
    const req         = store.count()
    req.onsuccess = () => { db.close(); resolve(req.result) }
    req.onerror   = () => { db.close(); reject(req.error) }
  })
}

// ── Sync ──────────────────────────────────────────────────────────────────────

export interface SyncResult {
  total:     number
  succeeded: number
  failed:    number
}

/**
 * Attempt to sync all queued submissions via the batch endpoint.
 * Calls onProgress(done, total) as each item resolves.
 *
 * Items that permanently fail (failCount >= 3) are left in the queue
 * so the user can manually retry or delete them.
 */
export async function syncQueue(
  onProgress?: (done: number, total: number) => void,
): Promise<SyncResult> {
  const queue = await getQueue()
  const total = queue.length

  if (total === 0) return { total: 0, succeeded: 0, failed: 0 }

  // Build the batch payload, mapping from QueuedSubmission → API shape
  const submissions = queue.map((q) => ({
    client_id:       q.id,
    program_id:      q.programId,
    form_id:         q.formId,
    submission_date: q.submissionDate,
    location_name:   q.locationName,
    location_lat:    q.locationLat,
    location_lng:    q.locationLng,
    data:            q.data,
    notes:           q.notes,
    // Base64 attachments are stored as data URIs; the batch endpoint
    // receives them as-is and stores them in the attachments JSONB array.
    attachments:     q.attachments.map((a) => a.dataUri),
    sync_source:     'batch_sync' as const,
    device_metadata: {
      platform:          'web',
      offline_queued_at: q.queuedAt,
    },
  }))

  let succeeded = 0
  let failed    = 0

  try {
    const res = await fetch('/api/field-data/batch', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ submissions }),
    })

    if (!res.ok) {
      // Server-level failure — increment all fail counts and bail
      await Promise.all(queue.map((q) => incrementFailCount(q.id)))
      failed = total
      onProgress?.(total, total)
      return { total, succeeded: 0, failed: total }
    }

    const body = (await res.json()) as {
      results: { client_id: string; ok: boolean }[]
    }

    let done = 0
    for (const item of body.results) {
      done++
      if (item.ok) {
        await dequeue(item.client_id)
        succeeded++
      } else {
        await incrementFailCount(item.client_id)
        failed++
      }
      onProgress?.(done, total)
    }
  } catch {
    // Network error — all failed
    await Promise.all(queue.map((q) => incrementFailCount(q.id)))
    failed = total
    onProgress?.(total, total)
  }

  return { total, succeeded, failed }
}
