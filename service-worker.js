importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js');

self.addEventListener('install', (event) => {
  console.log('Service worker install event!');

});

self.addEventListener('activate', (event) => {
  console.log('Service worker activate event!');
});
