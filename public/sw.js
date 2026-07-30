// ─── My Voice Service Worker ──────────────────────────────────────────────────
// Only job: cache the app shell so it loads offline
// Photos and data are handled by localStorage/IndexedDB in the app

const SHELL_CACHE = "myvoice-shell-v1";

// On install — cache the root page
self.addEventListener("install", (event) => {
  event.waitUntil(
    fetch("/")
      .then(response => {
        return caches.open(SHELL_CACHE).then(cache => {
          return cache.put("/", response);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// On activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// On fetch — network first, fall back to cache for navigation requests only
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          caches.open(SHELL_CACHE).then(cache => {
            cache.put(event.request, response.clone());
          });
          return response;
        })
        .catch(() => {
          return caches.match("/") || caches.match("/index.html");
        })
    );
    return;
  }

  const url = new URL(event.request.url);
  const isAsset = url.pathname.startsWith("/assets/") ||
                  url.pathname.endsWith(".js") ||
                  url.pathname.endsWith(".css");

  if (isAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            caches.open(SHELL_CACHE).then(cache => {
              cache.put(event.request, response.clone());
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
