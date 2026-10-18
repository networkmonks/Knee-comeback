/* Knee Comeback service worker: network-first for the app page (so updates arrive), cache fallback offline */
const V = 'knee-comeback-v3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || /\/$|\.html$/.test(new URL(req.url).pathname);
  if (isPage) {
    e.respondWith(Promise.race([fetch(req), timeout(4000)]).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put('./index.html', copy)); }
      return res;
    }).catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});
