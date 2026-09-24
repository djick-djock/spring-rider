// Offline support for the installed app: game files are fetched fresh when online
// (so updates arrive) and served from the cache when offline. Fonts are cached once.
const CACHE = "spring-rider-v1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-192.png", "./icons/maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const put = res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; };
  if (url.origin === location.origin) {
    // Only trust good responses: if the site ever goes away (404) or the phone is offline,
    // keep playing from the cached copy instead of caching the error page.
    const cached = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html"));
    e.respondWith(fetch(e.request).then(res => res.ok ? put(res) : cached().then(r => r || res)).catch(cached));
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(put)));
  }
});
