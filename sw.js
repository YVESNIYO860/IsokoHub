const CACHE_NAME = 'isokohub-pwa-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/home',
  '/manifest.json',
  '/css/style.css',
  '/js/app.js',
  '/js/home.js',
  '/js/data.js',
  '/js/supabase-config.js',
  '/assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
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

  const shouldFallbackToAppShell = event.request.mode === 'navigate' || event.request.destination === 'document';

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (!networkResponse.ok && shouldFallbackToAppShell) {
          return caches.match('./home');
        }
        return networkResponse;
      })
      .catch(() => {
        if (shouldFallbackToAppShell) {
          return caches.match('./home');
        }
        return caches.match(event.request);
      })
  );
});
