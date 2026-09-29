import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest {
  return {
    name: "Voculo",
    short_name: "Voculo",
    description: "Focused tools for turning audio into useful text, speech, and insight.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0A0A0A",
    icons: [{src: "/favicon.svg", sizes: "any", type: "image/svg+xml"}],
  };
}
