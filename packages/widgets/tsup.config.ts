import { cpSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  // Peer/optional deps stay external; optional ones are lazy-imported at
  // runtime so consumers without them never pay the cost.
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "mermaid",
    "canvas-confetti",
    "leaflet",
  ],
  async onSuccess() {
    // The styles are plain CSS (no build step) — ship them alongside the JS
    // so the published `./styles*` exports resolve inside dist/.
    cpSync("src/styles", "dist/styles", { recursive: true });
  },
});
