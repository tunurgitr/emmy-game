import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5191,
    strictPort: true, // fail loudly instead of silently sharing a busy port
  },
});
