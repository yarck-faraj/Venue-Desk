import { precacheWorker } from "./scripts/sw-precache.js";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [precacheWorker()],
  build: {
    // Preserve computed CSS values, including percentage background positions.
    cssMinify: false,
  },
});
