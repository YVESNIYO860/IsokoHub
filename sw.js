const CACHE_NAME = 'isokohub-pwa-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/home.js',
  './js/data.js',
  './js/supabase-config.js',
  './assets/logo.png'
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
          return caches.match('./index.html');
        }
        return networkResponse;
      })
      .catch(() => {
        if (shouldFallbackToAppShell) {
          return caches.match('./index.html');
        }
        return caches.match(event.request);
      })
  );
});
