const CACHE_NAME = 'puja-hisab-v2'; // ভার্সন v2 করে দেওয়া হলো
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  // পুরনো ক্যাশ ডিলিট করে নতুনটা ইনস্টল করবে
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
            return fetch(event.request);
        }
        return response || fetch(event.request);
      })
  );
});