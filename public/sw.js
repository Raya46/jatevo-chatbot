const _CACHE_NAME = "jatevo-chatbot-v1";
const STATIC_CACHE_NAME = "jatevo-static-v1";
const IMAGE_CACHE_NAME = "jatevo-images-v1";
const API_CACHE_NAME = "jatevo-api-v1";

// Regex pattern at top level for performance
const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)$/i;

// Files to cache for offline functionality
const STATIC_FILES = [
  "/",
  "/offline",
  "/(chat)",
  "/(auth)/login",
  "/(auth)/register",
  "/jatevo.png",
  "/images/demo-thumbnail.png",
];

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static files");
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log("Service Worker: Static files cached");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.log("Service Worker: Error caching static files:", error);
        // Continue with installation even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
            return Promise.resolve();
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Strategy 1: Cache First for static assets
  if (isStaticAsset(request.url)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // Strategy 2: Cache First for images (with network fallback)
  if (isImageRequest(request.url)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Return cached image and update in background
            fetch(request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
            });
            return response;
          }

          // Fetch from network and cache
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategy 3: Network First for API calls
  if (isApiRequest(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Strategy 4: Stale While Revalidate for navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((response) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          // Cache the new version
          if (networkResponse.ok) {
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        });

        // Return cached version immediately, or wait for network
        return response || fetchPromise;
      })
    );
    return;
  }

  // Default: Network First for everything else
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || "New message from Jatevo Chatbot",
      icon: "/jatevo.png",
      badge: "/jatevo.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: "1",
        url: data.url || "/",
      },
      actions: [
        {
          action: "open",
          title: "Open Chat",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || "Jatevo Chatbot",
        options
      )
    );
  }
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received.");

  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  } else if (event.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// Helper functions
function isStaticAsset(url) {
  return (
    url.includes("/_next/static/") ||
    url.includes("/jatevo.png") ||
    url.includes(".css") ||
    url.includes(".js") ||
    url.includes(".woff") ||
    url.includes(".woff2")
  );
}

function isImageRequest(url) {
  return (
    url.includes("/api/image/") ||
    url.includes("r2.dev") ||
    url.includes("r2.cloudflarestorage.com") ||
    url.includes("picsum.photos") ||
    IMAGE_REGEX.test(url)
  );
}

function isApiRequest(url) {
  return url.includes("/api/") && !url.includes("/api/image/");
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued offline actions here
  console.log("Background sync triggered");
  await Promise.resolve();
}
