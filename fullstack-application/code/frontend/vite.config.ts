import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    // Use domain-based aliases to avoid brittle ../../ imports in a large app.
    alias: {
      "@app": fileURLToPath(new URL("./src/App.tsx", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@config": fileURLToPath(new URL("./src/config", import.meta.url)),
      "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@layouts": fileURLToPath(new URL("./src/layouts", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
      "@utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
    },
  },

  base: "./",

  server: {
    host: true,          // allows external access
    allowedHosts: true,  // allows all domains (wildcard)
  },

  build: {
    outDir: "../backend/dist",
    target: "esnext",
    minify: false,
    sourcemap: false,
    cssMinify: false,
    reportCompressedSize: false,
  },

  esbuild: {
    target: "esnext",
    sourcemap: false,
  },
});
