// İlim Takip - çevrimdışı çalışma (önbellek)
// Her güncellemede V sürümünü bir artır (v4, v5...) ki eski önbellek temizlensin.
const V = 'ilim-takip-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;

  // Sayfa açılışı: önce önbellekten ver (internetsiz de açılır), arkada yenile
  if (r.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const net = fetch(r).then(res => {
          if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put('./index.html', cp)); }
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  // Diğer dosyalar (ikon, manifest): önbellek önce, yoksa ağdan al
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then(cached => {
      const net = fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
