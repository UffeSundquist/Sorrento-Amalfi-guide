const CACHE_NAME = 'amalfi-guide-v6';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(CACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always fetch live for external APIs
  const isExternal = url.includes('wttr.in') || url.includes('open-meteo.com') ||
                     url.includes('overpass') || url.includes('api.anthropic.com');
  if (isExternal) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response('{"error":"offline"}', { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }
  // Cache-first for app shell
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
      if (r && r.status === 200 && r.type === 'basic') {
        const c = r.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, c));
      }
      return r;
    }))
  );
});
