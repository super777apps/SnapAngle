const CACHE_NAME = 'snapangle-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './app.js',
  './icon-192.png',
  './icon-512.png',
  './click.mp3',
  './win.mp3',
  './try.mp3',
  './swipeX.mp3',
  './swipeY.mp3',
  // add any other images, CSS or assets you use
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(resp => resp || fetch(event.request))
      .catch(() => caches.match('./index.html'))
  );
});
