// 서비스 워커 — 껍데기를 캐시해 두고, 인터넷이 없어도 앱이 열리게 한다.
// 데이터는 캐시하지 않는다(데이터는 기기 안 IndexedDB 에 있다).
const CACHE = "azf-shell-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;            // 구글·OpenAI 호출은 건드리지 않는다
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const fresh = await fetch(req);
      if (fresh.ok) cache.put(req, fresh.clone());
      return fresh;
    } catch {
      const hit = await cache.match(req);
      if (hit) return hit;
      if (req.mode === "navigate") { const idx = await cache.match("./index.html") || await cache.match("./"); if (idx) return idx; }
      throw new Error("offline");
    }
  })());
});
