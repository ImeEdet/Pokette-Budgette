import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/*.png", "icons/*.svg"],
      manifest: {
        id: "/",
        name: "Pokette Budgette",
        short_name: "Pokette",
        description:
          "Little plans, big dreams. Your personal offline money planner.",
        theme_color: "#DCC9F5",
        background_color: "#FCFAF7",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "en",
        icons: [
          {
            src: "/icons/pokette-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pokette-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/pokette-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff,woff2,png,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        clientsClaim: true,
        skipWaiting: false,
        // Cache the complete app, including its locally bundled fonts. Financial
        // records stay in localStorage; no API or external requests are cached.
        runtimeCaching: [],
      },
      devOptions: { enabled: false },
    }),
  ],
  // Keep development isolated from the production service worker and records.
  server: { port: 5174, strictPort: true },
  preview: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
        },
      },
    },
  },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
