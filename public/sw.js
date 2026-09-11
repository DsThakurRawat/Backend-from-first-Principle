/* Progressive Web App service worker for Backend from First Principles.
 *
 * Strategy (chosen so Pagefind + chapter updates keep working):
 * - Precache only the thin install shell on install.
 * - HTML navigations: network-first, fall back to cache, then offline.html.
 * - Static assets (_astro, icons, fonts, pagefind, etc.): stale-while-revalidate.
 * - Never precache every chapter — that would bloat install and go stale.
 */

const CACHE_VERSION = 'bfp-pwa-v1';
const SHELL = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * @param {Request} request
 * @param {Response} response
 */
async function putInCache(request, response) {
  if (!response || !response.ok) return;
  // Opaque cross-origin responses are not useful to cache for this doc site.
  if (response.type !== 'basic' && response.type !== 'cors') return;
  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response);
}

/**
 * Network first for documents so published chapter edits show up promptly.
 * @param {Request} request
 */
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    void putInCache(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }
    throw new Error('offline');
  }
}

/**
 * Serve cache immediately, refresh in the background.
 * @param {Request} request
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((fresh) => {
      void putInCache(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  if (cached) {
    void networkPromise;
    return cached;
  }

  const fresh = await networkPromise;
  if (fresh) return fresh;
  throw new Error('offline');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always get a fresh worker — otherwise updates stall behind a cached copy.
  if (url.pathname === '/sw.js') return;

  const isNavigate = request.mode === 'navigate' || request.destination === 'document';
  const isHtml = isNavigate || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  event.respondWith(isHtml ? networkFirst(request) : staleWhileRevalidate(request));
});
