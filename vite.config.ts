import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const r = (...segments: string[]) => path.resolve(import.meta.dirname, ...segments);

export default defineConfig({
  root: r("client"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": r("client", "src"),
      "@shared": r("shared"),
    },
  },
  build: {
    outDir: r("dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
});
