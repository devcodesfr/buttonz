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
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
