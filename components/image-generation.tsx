"use client";

import { motion } from "framer-motion";
import { Download, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageModal } from "./image-modal";

type ImageGenerationResult = {
  imageUrl: string;
  prompt: string;
  id: string;
  cached?: boolean;
};

type ImageGenerationProps = {
  result: ImageGenerationResult;
};

export function ImageGeneration({ result }: ImageGenerationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border bg-background p-4 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
      >
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon className="size-4 text-blue-500" />
          <span className="font-medium text-muted-foreground text-sm">
            Generated Image
          </span>
          {result.cached && (
            <span className="rounded-full bg-green-100 px-2 py-1 text-green-800 text-xs">
              Cached
            </span>
          )}
        </div>

        <div className="space-y-3">
          <button
            className="relative w-full overflow-hidden rounded-lg border p-0 transition-opacity hover:opacity-80"
            onClick={() => setIsModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsModalOpen(true);
              }
            }}
            type="button"
          >
            <Image
              alt={result.prompt}
              className="w-full object-cover"
              height={1024}
              src={result.imageUrl}
              width={1024}
            />
          </button>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 text-muted-foreground text-sm">
              <span className="font-medium">Prompt:</span>
              <div className="break-words">{result.prompt}</div>
            </div>
            <Button
              className="mt-1 flex-shrink-0"
              onClick={async () => {
                try {
                  // Fetch the image from R2 URL
                  const response = await fetch(result.imageUrl);
                  const blob = await response.blob();

                  // Create download link
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `generated-image-${Date.now()}.png`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Clean up object URL
                  URL.revokeObjectURL(link.href);
                } catch {
                  // Fallback to direct link download
                  const link = document.createElement("a");
                  link.href = result.imageUrl;
                  link.download = `generated-image-${Date.now()}.png`;
                  link.target = "_blank";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </motion.div>

      <ImageModal
        alt={result.prompt}
        imageUrl={result.imageUrl}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
