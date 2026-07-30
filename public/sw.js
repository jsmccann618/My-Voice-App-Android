// ─── My Voice Service Worker ──────────────────────────────────────────────────
// Caches Firebase Storage photos so they work offline

const CACHE_NAME = "myvoice-photos-v1";

// On install — activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// On activate — claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// On fetch — intercept Firebase Storage image requests
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Only cache Firebase Storage images and firebasestorage URLs
  const isFirebaseStorage = url.includes("firebasestorage.googleapis.com") ||
                            url.includes("firebasestorage.app");

  if (!isFirebaseStorage) return; // Let everything else pass through normally

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Check cache first
      const cached = await cache.match(event.request);
      if (cached) {
        // Return cached version immediately
        // Also refresh in background if online
        if (navigator.onLine) {
          fetch(event.request).then((fresh) => {
            if (fresh && fresh.ok) cache.put(event.request, fresh.clone());
          }).catch(() => {});
        }
        return cached;
      }

      // Not in cache — try network
      try {
        const response = await fetch(event.request);
        if (response && response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        // Offline and not cached — return nothing (image just won't show)
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })
  );
});

// Listen for a message to pre-cache a list of URLs
self.addEventListener("message", (event) => {
  if (event.data?.type === "PRECACHE_PHOTOS") {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        if (!url || !url.startsWith("http")) return;
        fetch(url).then((response) => {
          if (response && response.ok) cache.put(url, response);
        }).catch(() => {}); // Silently ignore failures
      });
    });
  }
});