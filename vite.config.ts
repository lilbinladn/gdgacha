import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Extra hostnames the dev server should answer for (comma separated), e.g. a
// preview proxy. Left empty locally, where localhost is allowed by default.
const allowedHosts = (process.env.VITE_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

// Relative base so the same build works on github.io/<repo>/ and on a custom domain.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    ...(allowedHosts.length ? { allowedHosts } : {}),
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 2500,
  },
});
