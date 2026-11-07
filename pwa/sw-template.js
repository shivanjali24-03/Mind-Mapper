/* Mind Mapper service worker (generated at build time; do not edit dist/sw.js by hand).
 * - Pre-caches every file from the build, so the app works offline.
 * - Pages: network first, falling back to the cached app when offline.
 * - Build files (hashed names) and icons: cache first.
 * - Never touches the staging/ or dev/ environments or the api/ server.
 */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = `mind-mapper-${VERSION}`;
const scope = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([scope, ...PRECACHE.map((f) => scope + f)]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mind-mapper-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(scope)) return;
  const path = req.url.slice(scope.length);
  if (path.startsWith('staging/') || path.startsWith('dev/') || path.startsWith('api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(scope, copy));
          return res;
        })
        .catch(() => caches.match(scope)),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
