const CACHE_NAME = 'kitesurf-passion-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests
  if (url.origin !== location.origin) return;

  // Skip API calls and Supabase requests
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return;

  // For navigation requests (HTML pages) - Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed build assets: always go to network so we never serve a stale chunk
  // that references hashes deleted by a new deploy.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Other static assets (images, fonts, favicon) - Cache first, fallback to network
  if (url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|woff2?|css)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(request).then((response) => {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, response);
            });
          });
          return cachedResponse;
        }

        // Not in cache - fetch and cache
        return fetch(request).then((response) => {
          const clonedResponse = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: Network first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clonedResponse = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});
