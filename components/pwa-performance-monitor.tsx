"use client";

import { useEffect, useState } from "react";

type PerformanceMetrics = {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  cacheHitRate: number;
  offlineTime: number;
};

const calculateCacheHitRate = (): number => {
  // This is a simplified calculation
  // In a real implementation, you'd track actual cache hits/misses
  return Math.random() * 100; // Placeholder
};

export default function PWAPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when performance monitoring is enabled
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      const fcp =
        paint.find((entry) => entry.name === "first-contentful-paint")
          ?.startTime || 0;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;

      // Get LCP (Largest Contentful Paint)
      let lcp = 0;
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries.at(-1);
            if (lastEntry) {
              lcp = lastEntry.startTime;
            }
          });
          observer.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (_e) {
          console.log("LCP measurement not supported");
        }
      }

      // Get CLS (Cumulative Layout Shift)
      let cls = 0;
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                cls += (entry as any).value;
              }
            }
          });
          observer.observe({ entryTypes: ["layout-shift"] });
        } catch (_e) {
          console.log("CLS measurement not supported");
        }
      }

      // Get FID (First Input Delay)
      let fid = 0;
      if ("PerformanceObserver" in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              fid = (entry as any).processingStart - entry.startTime;
            }
          });
          observer.observe({ entryTypes: ["first-input"] });
        } catch (_e) {
          console.log("FID measurement not supported");
        }
      }

      // Calculate cache hit rate (simplified)
      const cacheHitRate = calculateCacheHitRate();

      setMetrics({
        loadTime,
        firstContentfulPaint: fcp,
        largestContentfulPaint: lcp,
        cumulativeLayoutShift: cls,
        firstInputDelay: fid,
        cacheHitRate,
        offlineTime: 0, // Would need more complex tracking
      });
    };

    // Measure after page load
    if (document.readyState === "complete") {
      setTimeout(measurePerformance, 0);
    } else {
      window.addEventListener("load", () => {
        setTimeout(measurePerformance, 0);
      });
    }

    // Monitor online/offline status
    let offlineStartTime = 0;
    const handleOffline = () => {
      offlineStartTime = Date.now();
    };

    const handleOnline = () => {
      if (offlineStartTime > 0) {
        const offlineDuration = Date.now() - offlineStartTime;
        setMetrics((prev) =>
          prev
            ? { ...prev, offlineTime: prev.offlineTime + offlineDuration }
            : null
        );
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const getPerformanceGrade = (
    metric: keyof PerformanceMetrics,
    value: number
  ): string => {
    const thresholds = {
      loadTime: { good: 2000, needsImprovement: 4000 },
      firstContentfulPaint: { good: 1800, needsImprovement: 3000 },
      largestContentfulPaint: { good: 2500, needsImprovement: 4000 },
      cumulativeLayoutShift: { good: 0.1, needsImprovement: 0.25 },
      firstInputDelay: { good: 100, needsImprovement: 300 },
      cacheHitRate: { good: 80, needsImprovement: 50 },
      offlineTime: { good: 0, needsImprovement: 10_000 },
    };

    const threshold = thresholds[metric];
    if (metric === "cacheHitRate") {
      return value >= threshold.good
        ? "text-green-600"
        : value >= threshold.needsImprovement
          ? "text-yellow-600"
          : "text-red-600";
    }
    return value <= threshold.good
      ? "text-green-600"
      : value <= threshold.needsImprovement
        ? "text-yellow-600"
        : "text-red-600";
  };

  if (!metrics || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="rounded-lg border border-border bg-background p-2 text-xs shadow-lg"
        onClick={() => setIsVisible(!isVisible)}
        type="button"
      >
        📊 PWA Metrics
      </button>

      {isVisible && (
        <div className="mt-2 w-80 rounded-lg border border-border bg-background p-4 shadow-lg">
          <h3 className="mb-3 font-semibold text-sm">
            PWA Performance Metrics
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Load Time:</span>
              <span
                className={getPerformanceGrade("loadTime", metrics.loadTime)}
              >
                {metrics.loadTime.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>FCP:</span>
              <span
                className={getPerformanceGrade(
                  "firstContentfulPaint",
                  metrics.firstContentfulPaint
                )}
              >
                {metrics.firstContentfulPaint.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>LCP:</span>
              <span
                className={getPerformanceGrade(
                  "largestContentfulPaint",
                  metrics.largestContentfulPaint
                )}
              >
                {metrics.largestContentfulPaint.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>CLS:</span>
              <span
                className={getPerformanceGrade(
                  "cumulativeLayoutShift",
                  metrics.cumulativeLayoutShift
                )}
              >
                {metrics.cumulativeLayoutShift.toFixed(3)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>FID:</span>
              <span
                className={getPerformanceGrade(
                  "firstInputDelay",
                  metrics.firstInputDelay
                )}
              >
                {metrics.firstInputDelay.toFixed(0)}ms
              </span>
            </div>

            <div className="flex justify-between">
              <span>Cache Hit Rate:</span>
              <span
                className={getPerformanceGrade(
                  "cacheHitRate",
                  metrics.cacheHitRate
                )}
              >
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between">
              <span>Offline Time:</span>
              <span
                className={getPerformanceGrade(
                  "offlineTime",
                  metrics.offlineTime
                )}
              >
                {(metrics.offlineTime / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="mt-3 border-border border-t pt-3">
            <div className="text-muted-foreground text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Needs Improvement</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Poor</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
