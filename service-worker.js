importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

// Update this version number whenever you want to force cache refresh
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `qz-games-${CACHE_VERSION}`;

// List of cache names to keep (only current version)
const CACHE_WHITELIST = [CACHE_NAME];

self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // You can optionally pre-cache critical resources here
      // return cache.addAll(['/index.html', '/styles.css', '/main.js']);
      return cache;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete all outdated caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!CACHE_WHITELIST.includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Always try network first
    fetch(event.request)
      .then((response) => {
        // Check if caching is enabled via a message from the client
        // Since service worker can't access localStorage directly,
        // we'll cache by default but allow clearing via the settings page
        return response;
      })
      .catch(() => {
        // If network fails, try cache as fallback
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a custom offline page or error
          return new Response('Offline - No cached version available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
