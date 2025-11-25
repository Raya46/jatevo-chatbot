"use client";

import { Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ImageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
};

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && imageUrl) {
      setIsLoading(true);
      // Preload image
      const img = document.createElement("img");
      img.onload = () => setIsLoading(false);
      img.onerror = () => setIsLoading(false);
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="flex h-[90vh] w-full max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <div className="flex items-center justify-between gap-2">
            <DialogDescription className="flex-1 truncate">
              {alt}
            </DialogDescription>
            <Button
              className="flex-shrink-0"
              onClick={async () => {
                try {
                  // Fetch the image from R2 URL
                  const response = await fetch(imageUrl);
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
                  link.href = imageUrl;
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
        </DialogHeader>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-blue-500 border-b-2" />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center">
              <Image
                alt={alt}
                className="max-h-full max-w-full rounded-lg object-contain"
                height={600}
                priority
                src={imageUrl}
                width={800}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
