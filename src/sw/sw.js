// Network first, falls back to the cached copy so the app opens offline.
const C = "__CACHE_NAME__";
const PRECACHE = "__PRECACHE_FILES__";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(C);
      const request = (url) =>
        new Request(url, { mode: "cors", credentials: "same-origin", cache: "reload" });
      // The application's own files must all be cached, or this install fails and retries later.
      await cache.addAll(PRECACHE.filter((url) => url.startsWith("./")).map(request));
      // The classic SDK scripts come from the public CDN. Cache them when reachable, but never let
      // an unreachable CDN stop the till from installing (they are also cached when first fetched).
      await Promise.allSettled(
        PRECACHE.filter((url) => !url.startsWith("./")).map((url) => cache.add(request(url))),
      );
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && u.hostname !== "www.gstatic.com") return; // never touch Firebase API traffic
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) {
          const cp = res.clone();
          caches.open(C).then((c) => c.put(r, cp));
        }
        return res;
      })
      .catch(() =>
        caches.match(r).then((m) => m || (r.mode === "navigate" ? caches.match("./") : undefined)),
      ),
  );
});
