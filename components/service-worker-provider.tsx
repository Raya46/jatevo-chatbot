"use client";

import { useEffect } from "react";

export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      // Add an event listener to detect when the registered
      // service worker has installed but is waiting to activate.
      wb.addEventListener("waiting", (event: any) => {
        console.log(
          `A new service worker version has installed: ${event.sw.version}`
        );

        // Optionally show a notification to the user
        if (confirm("A new version is available. Reload to update?")) {
          wb.addEventListener("controlling", () => {
            window.location.reload();
          });
          wb.messageSW({ type: "SKIP_WAITING" });
        }
      });

      // Register the service worker
      wb.register();
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Fallback for environments without workbox
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully:", registration);

          // Check for updates periodically
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000
          ); // Check every hour
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}

// Extend Window interface for workbox
declare global {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: Required for global augmentation
  interface Window {
    workbox?: any;
  }
}
