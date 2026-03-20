// ── Omanye Field Data — Service Worker ───────────────────────────────────────
// Scope: /org/*/field/** routes only (registered by the field layout).
// Strategy:
//   • API calls → network-only (data must be fresh or queued by IndexedDB)
//   • Navigation requests → network-first with offline fallback to a cached shell
//   • Static assets → stale-while-revalidate

const CACHE_NAME = 'omanye-field-v1'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/offline.html',
]

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 1. API requests — network only; failures bubble to the app (IndexedDB queue handles offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // 2. Navigation — network-first, fall back to offline shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((r) => r ?? new Response('Offline', { status: 503 }))
      )
    )
    return
  }

  // 3. Static assets — stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request)
      const networkFetch = fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone())
        return response
      })
      return cached ?? networkFetch
    })
  )
})

// ── Background sync (for future Push API integration) ────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'field-sync') {
    // The actual sync is handled in the app via IndexedDB + fetch.
    // This event simply wakes the app so the sync can run.
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) =>
        Promise.all(clients.map((c) => c.postMessage({ type: 'BACKGROUND_SYNC' })))
      )
    )
  }
})
