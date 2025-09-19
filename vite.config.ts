import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import glsl from "vite-plugin-glsl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Conditionally import Replit plugin only in Replit environment
const plugins = [react(), glsl()];
if (process.env.REPLIT_DB_URL || process.env.REPL_ID) {
  try {
    const runtimeErrorOverlay = require("@replit/vite-plugin-runtime-error-modal");
    plugins.push(runtimeErrorOverlay());
  } catch (e) {
    console.log("Replit plugin not available, skipping...");
  }
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  // Add support for large models and audio files
  assetsInclude: ["**/*.gltf", "**/*.glb", "**/*.mp3", "**/*.ogg", "**/*.wav"],
});
