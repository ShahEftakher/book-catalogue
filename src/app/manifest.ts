import type { MetadataRoute } from "next";

// Lets the catalogue be added to a phone's home screen and open full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Book Catalogue",
    short_name: "Books",
    description: "Eftakher's personal library — Bangla and English books.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
