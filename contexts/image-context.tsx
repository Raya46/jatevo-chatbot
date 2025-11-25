"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type GeneratedImage = {
  id: string;
  imageUrl: string;
  prompt: string;
};

type ImageContextType = {
  generatedImages: GeneratedImage[];
  addGeneratedImage: (image: GeneratedImage) => void;
  getGeneratedImage: (id: string) => GeneratedImage | undefined;
};

const ImageContext = createContext<ImageContextType | undefined>(undefined);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const addGeneratedImage = (image: GeneratedImage) => {
    setGeneratedImages((prev) => {
      const existing = prev.find((img) => img.id === image.id);
      if (existing) {
        return prev.map((img) => (img.id === image.id ? image : img));
      }
      return [...prev, image];
    });
  };

  const getGeneratedImage = (id: string) => {
    return generatedImages.find((img) => img.id === id);
  };

  return (
    <ImageContext.Provider
      value={{
        generatedImages,
        addGeneratedImage,
        getGeneratedImage,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error("useImages must be used within an ImageProvider");
  }
  return context;
}
