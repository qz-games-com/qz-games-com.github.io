importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

// Update this version number whenever you want to force cache refresh
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `qz-games-${CACHE_VERSION}`;

// List of cache names to keep (only current version)
const CACHE_WHITELIST = [CACHE_NAME];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event - Version:', CACHE_VERSION);

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cache opened:', CACHE_NAME);
      // You can optionally pre-cache critical resources here
      // return cache.addAll(['/index.html', '/styles.css', '/main.js']);
      return cache;
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event - Cleaning old caches');

  event.waitUntil(
    Promise.all([
      // Delete all outdated caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!CACHE_WHITELIST.includes(cacheName)) {
              console.log('[Service Worker] Deleting outdated cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('[Service Worker] Cleanup complete, now controlling all clients');
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network first, then cache strategy for HTML files
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache first, then network for other resources
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing all caches');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[Service Worker] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
