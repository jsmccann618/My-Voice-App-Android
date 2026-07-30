// ─── My Voice Service Worker ──────────────────────────────────────────────────
// Only caches Firebase Storage photos — does NOT intercept app navigation

const PHOTO_CACHE = "myvoice-photos-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== PHOTO_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // ONLY intercept Firebase Storage photo requests
  if (!url.includes("firebasestorage.googleapis.com") &&
      !url.includes("firebasestorage.app")) return;

  event.respondWith(
    caches.open(PHOTO_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        // Refresh in background if online
        if (navigator.onLine) {
          fetch(event.request).then(r => { if (r?.ok) cache.put(event.request, r.clone()); }).catch(() => {});
        }
        return cached;
      }
      try {
        const response = await fetch(event.request);
        if (response?.ok) cache.put(event.request, response.clone());
        return response;
      } catch {
        return new Response("", { status: 503 });
      }
    })
  );
});

// Precache photos sent from the app
self.addEventListener("message", (event) => {
  if (event.data?.type !== "PRECACHE_PHOTOS") return;
  caches.open(PHOTO_CACHE).then(cache => {
    (event.data.urls || []).forEach(url => {
      if (!url?.startsWith("http")) return;
      fetch(url).then(r => { if (r?.ok) cache.put(url, r); }).catch(() => {});
    });
  });
});


