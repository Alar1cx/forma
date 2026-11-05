// Offline shell for FORMA. Bump the version when index.html changes.
const V = 'forma-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.includes('openfoodfacts')) return; // food lookups always go live
  if (e.request.mode === 'navigate'){ // newest app first, cached copy when offline
    e.respondWith(fetch(e.request).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok && (u.origin === location.origin || /fonts|unpkg/.test(u.hostname))) { const cp = res.clone(); caches.open(V).then(c => c.put(e.request, cp)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
