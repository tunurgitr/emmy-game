import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative base so the built site works from any GitHub Pages subpath
  // (e.g. https://<user>.github.io/<repo>/).
  base: "./",
  server: {
    host: true,
    port: 5191,
    strictPort: true, // fail loudly instead of silently sharing a busy port
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        game: resolve(__dirname, "game.html"),
        mockups: resolve(__dirname, "mockups.html"),
        mockupA: resolve(__dirname, "mockup-a.html"),
        mockupB: resolve(__dirname, "mockup-b.html"),
      },
    },
  },
});
