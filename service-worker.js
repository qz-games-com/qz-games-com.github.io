importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

workbox.routing.registerRoute(
    //({request}) => request.destination === 'image',
    //new workbox.strategies.NetworkFirst()
);

self.addEventListener('install', (event) => {
  console.log('Service worker install event!');
  //event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(precacheResources)));

});

self.addEventListener('activate', (event) => {
  console.log('Service worker activate event!');
});
