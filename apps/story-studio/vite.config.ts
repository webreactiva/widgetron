import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { storyStudioApi } from "./src/dev-api";

const widgetsSrc = fileURLToPath(
  new URL("../../packages/widgets/src", import.meta.url),
);

export default defineConfig({
  // dist/ belongs to per-guide exports (`story render` → dist/<slug>/); the
  // studio app itself builds elsewhere so it never clobbers rendered guides.
  build: { outDir: "dist-app" },
  plugins: [react(), tailwindcss(), storyStudioApi()],
  resolve: {
    // Only the library's INTERNAL `@/` alias, required to consume its source
    // through the package `exports` (which point at src). Story Studio's own
    // code never uses `@/` — it imports @webreactiva/widgetron public
    // entrypoints only, so the npm boundary is exercised from day one.
    alias: [{ find: /^@\//, replacement: `${widgetsSrc}/` }],
  },
});
