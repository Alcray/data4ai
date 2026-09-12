import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  base: "/data4ai/",
  plugins: [react()],
  server: {
    allowedHosts: ["xbox-360.tail14ec04.ts.net"],
  },
});
