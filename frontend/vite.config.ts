import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths keep the static build working when it is served from
  // a sub-path (e.g. /debt-tracker on the portfolio site) rather than the root.
  base: "./",
  server: {
    port: 5173,
  },
});
