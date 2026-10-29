// MySmartBox Service Worker – Netzwerk zuerst, offline aus dem Cache
const CACHE = 'mysmartbox-1.2.1';
const ASSETS = ['./', './index.html', './box.js', './app.js', './manifest.json', './icon-192.png', './icon-512.png', './jazm-logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache: 'reload'})))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const own = url.origin === location.origin, lib = /^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)$/.test(url.hostname);
  if (!own && !lib) return;
  e.respondWith(
    fetch(own ? req.url : req, own ? {cache: 'no-cache', credentials: 'same-origin'} : undefined).then(res => {
      if (res.ok && (own || res.type === 'cors')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (own ? caches.match('./index.html') : Response.error())))
  );
});
