import { defineConfig } from "vitest/config";

// Engine tests are node-only (schema, resolve, srt, theme) — no widget
// rendering here; widgets have their own suite in packages/widgets.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
