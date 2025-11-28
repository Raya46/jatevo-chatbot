"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ImageGenerationSkeleton() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-background p-4 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="size-4 text-blue-500" />
        <span className="font-medium text-muted-foreground text-sm">
          Generating Image...
        </span>
      </div>

      <div className="space-y-3">
        {/* Image placeholder skeleton */}
        <Skeleton className="aspect-square w-full rounded-lg" />

        {/* Prompt skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
