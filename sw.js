const CACHE_NAME = 'isokohub-pwa-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/home',
  '/manifest.json',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/assets/pwa-icon-maskable-512.png',
  '/assets/logo.png',
  '/js/app.js',
  '/js/home.js',
  '/js/data.js',
  '/js/supabase-config.js'
];
const CACHEABLE_DESTINATIONS = new Set(['document', 'font', 'image', 'script', 'style']);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('isokohub-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const destination = new URL('/admin?tab=notifications', self.location.origin).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const adminWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (adminWindow) {
      await adminWindow.navigate(destination);
      return adminWindow.focus();
    }
    return self.clients.openWindow(destination);
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }
  if (requestUrl.pathname.startsWith('/api/')) return;

  const shouldFallbackToAppShell = event.request.mode === 'navigate' || event.request.destination === 'document';

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const networkResponse = await fetch(event.request);
        const shouldCache = networkResponse.ok
          && networkResponse.type !== 'opaque'
          && (shouldFallbackToAppShell
            || CACHEABLE_DESTINATIONS.has(event.request.destination)
            || requestUrl.pathname === '/manifest.json');
        if (shouldCache) await cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
        if (shouldFallbackToAppShell) {
          return await cache.match('/') || Response.error();
        }
        return Response.error();
      }
    })()
  );
});
