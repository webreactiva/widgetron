import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const widgetsSrc = fileURLToPath(
  new URL("../../packages/widgets/src", import.meta.url),
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // Consume the library by its real package name, resolved to source so
      // Vite transpiles the .tsx directly (no build step during dev).
      { find: "@webreactiva/widgetron", replacement: `${widgetsSrc}/index.ts` },
      // The library's internal `@/` alias → its own src.
      { find: /^@\//, replacement: `${widgetsSrc}/` },
    ],
  },
});
