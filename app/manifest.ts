import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jatevo AI Chatbot",
    short_name: "Jatevo",
    description: "AI-powered chatbot with image generation capabilities",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["productivity", "utilities", "ai"],
    icons: [
      {
        src: "/jatevo.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/jatevo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/images/demo-thumbnail.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Jatevo Chatbot Interface",
      },
    ],
  };
}
