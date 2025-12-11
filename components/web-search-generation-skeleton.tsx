"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WebSearchGenerationSkeleton() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-background p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Search className="size-4 text-green-500" />
        <span className="font-medium text-muted-foreground text-sm">
          Searching the web...
        </span>
      </div>

      <div className="space-y-3">
        {/* Query skeleton */}
        <div className="rounded-md bg-muted p-3">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Search content skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>

        {/* Sources skeleton */}
        <div className="border-t pt-3">
          <Skeleton className="mb-2 h-3 w-20" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                className="flex items-start gap-2 rounded-md border p-2"
                key={`skeleton-${i}`}
              >
                <Skeleton className="size-5 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
