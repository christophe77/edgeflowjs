import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  envDir: path.resolve(__dirname, "../.."),
  resolve: { alias: {} },
  build: {
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          bridge: ["@edgeflowjs/bridge/client"],
        },
      },
    },
  },
});
