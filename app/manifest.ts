import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest {
  return {
    name: "Voculo",
    short_name: "Voculo",
    description: "Focused tools for turning audio into useful text, speech, and insight.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#FFFFFF",
    icons: [
      {src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any"},
      {src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"},
      {src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any"},
    ],
  };
}
