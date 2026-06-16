const CACHE_NAME = 'puja-hisab-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Service Worker Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Data
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ফায়ারবেসের ডেটাবেস রিকোয়েস্টগুলো ক্যাশ না করে সরাসরি নেটওয়ার্ক থেকে নেবে
        if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
            return fetch(event.request);
        }
        return response || fetch(event.request);
      })
  );
});