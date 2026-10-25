// Arene des Origines : cache hors ligne (version 3dd7f886f7, correctif iPhone 1)
const CACHE = 'arene-3dd7f886f7';
const PRE = ["./", "index.html", "favicon.png", "icon-180.png", "icon-192.png", "icon-512.png", "manifest.webmanifest", "sw.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(PRE.map(u =>
      c.add(new Request(u, {mode: u.startsWith('http') ? 'cors' : 'same-origin', cache: 'reload'})).catch(err => console.warn('precache', u, err))
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('arene-') && k !== CACHE && k !== 'arene-cine').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// index.html et la page : RESEAU D'ABORD (le cache seulement hors ligne), pour que
// chaque correction arrive aussi sur les iPhone qui ont deja la page en cache.
function arPage(url, req) {
  if (req.mode === 'navigate') return true;
  const p = url.pathname;
  return p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('/sw.js') || p.endsWith('/manifest.webmanifest');
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cine = url.pathname.indexOf('/cine/') >= 0;
  if (url.origin === location.origin && arPage(url, req)) {
    e.respondWith((async () => {
      try {
        const r = await fetch(url.href, {cache: 'no-cache', credentials: 'same-origin'});
        if (r.ok && r.status === 200) { const c = await caches.open(CACHE); c.put(req, r.clone()); }
        return r;
      } catch (err) {
        const any = await caches.match(req, {ignoreSearch: true});
        if (any) return any;
        throw err;
      }
    })());
    return;
  }
  // les videos (requetes Range sur iPhone) : on sert le fichier entier depuis le cache si on l'a
  e.respondWith((async () => {
    const store = await caches.open(cine ? 'arene-cine' : CACHE);
    const hit = await store.match(url.href, {ignoreSearch: true});
    if (hit) {
      const range = req.headers.get('range');
      if (cine && range) {
        const buf = await hit.arrayBuffer();
        const m = /bytes=(\d+)-(\d*)/.exec(range);
        const a = m ? parseInt(m[1], 10) : 0;
        const b = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
        return new Response(buf.slice(a, b + 1), {status: 206, headers: {
          'Content-Type': 'video/mp4', 'Content-Range': 'bytes ' + a + '-' + b + '/' + buf.byteLength,
          'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes'}});
      }
      return hit;
    }
    try {
      if (cine) {
        // on telecharge la video entiere une fois, puis on repond depuis le cache
        const full = await fetch(url.href);
        if (full.ok && full.status === 200) {
          await store.put(url.href, full.clone());
          const range = req.headers.get('range');
          if (range) { const r2 = await store.match(url.href); return r2 ? (await self.handleRange(r2, range)) : full; }
        }
        return full;
      }
      const resp = await fetch(req);
      if (resp.ok && resp.status === 200 && url.origin === location.origin) store.put(req, resp.clone());
      return resp;
    } catch (err) {
      const any = await caches.match(req, {ignoreSearch: true});
      if (any) return any;
      throw err;
    }
  })());
});
self.handleRange = async function (resp, range) {
  const buf = await resp.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  const a = m ? parseInt(m[1], 10) : 0;
  const b = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  return new Response(buf.slice(a, b + 1), {status: 206, headers: {'Content-Type': 'video/mp4',
    'Content-Range': 'bytes ' + a + '-' + b + '/' + buf.byteLength, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes'}});
};
