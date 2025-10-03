import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  server: {
    port: 3000,   
    host: true,
    open: true,
    proxy: {
    "/api": { target: "http://localhost:3001", changeOrigin: true }
  }
  }
});
