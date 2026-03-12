//Code that will tell the browser to store the app's files so it can work offline
const CACHE_NAME = 'occ-cache-v2';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API / auth requests — always go to network
  if (url.hostname.includes('supabase')) {
    return; // let the browser handle it normally
  }

  // For SPA navigation requests, serve the cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // For other static assets, try cache first then network
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});