// Billenboek service worker
// Doel: installeerbaarheid + nette offline-fallback.
// Belangrijk: dit is een privé-app met gevoelige (baby)gegevens per sessie.
// Daarom cachen we GEEN pagina's of server-action-responses met data,
// alleen statische, niet-persoonlijke bestanden (app-schil, iconen, manifest).

const CACHE_VERSION = "billenboek-v1"
const STATIC_CACHE = `${CACHE_VERSION}-static`

const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("billenboek-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return // laat server actions / mutaties altijd door het netwerk gaan

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Statische bestanden: cache-first, met network fallback + verversing op de achtergrond.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // Navigatie (pagina's): altijd netwerk-first, nooit de HTML zelf cachen
  // (bevat persoonlijke gegevens). Alleen bij géén netwerk: offline-pagina tonen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    )
    return
  }

  // Overige GET-requests: gewoon netwerk, geen caching.
})
