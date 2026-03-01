const CACHE_NAME = 'bugly-v1';
const assets = [
  'home.html',
  'error.css',
  'error.js',
  'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js',
  'https://unpkg.com/aos@2.3.1/dist/aos.css'
];

// Instalação e Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// Resposta Instantânea
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});