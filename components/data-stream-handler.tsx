"use client";

import { useEffect } from "react";
import { useImages } from "@/contexts/image-context";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream, setDataStream } = useDataStream();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const { addGeneratedImage } = useImages();

  useEffect(() => {
    if (!dataStream?.length) {
      return;
    }

    const newDeltas = dataStream.slice();
    setDataStream([]);

    for (const delta of newDeltas) {
      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) =>
          currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draftArtifact,
              documentId: delta.data,
              status: "streaming",
            };

          case "data-title":
            return {
              ...draftArtifact,
              title: delta.data,
              status: "streaming",
            };

          case "data-kind":
            return {
              ...draftArtifact,
              kind: delta.data,
              status: "streaming",
            };

          case "data-clear":
            return {
              ...draftArtifact,
              content: "",
              status: "streaming",
            };

          case "data-finish":
            return {
              ...draftArtifact,
              status: "idle",
            };

          case "data-imageDelta":
            // Handle image generation
            try {
              const imageData = JSON.parse(delta.data);
              addGeneratedImage({
                id: imageData.id,
                imageUrl: imageData.imageUrl,
                prompt: imageData.prompt,
              });
            } catch (error) {
              console.error("Failed to parse image data:", error);
            }
            return draftArtifact;

          default:
            return draftArtifact;
        }
      });
    }
  }, [
    dataStream,
    setDataStream,
    setArtifact,
    setMetadata,
    artifact,
    addGeneratedImage,
  ]);

  return null;
}
