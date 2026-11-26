// Network first, falls back to the cached copy so the app opens offline.
const C = "vd-v24";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && u.hostname !== "www.gstatic.com") return;   // never touch Firebase API traffic
  e.respondWith(
    fetch(r).then((res) => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then((c) => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then((m) => m || (r.mode === "navigate" ? caches.match("./") : undefined)))
  );
});
