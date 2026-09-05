import { defineConfig } from "@playwright/test";

/**
 * Environments that ship their own Chromium (CI images, sandboxes) rather than
 * letting `playwright install` fetch a version-pinned one. Without this the
 * runner insists on the exact build its version pins and fails on a browser
 * that is sitting right there.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

/**
 * The browser pass — the checks jsdom structurally cannot make.
 *
 * The unit suite fakes the two things several widgets are actually built on:
 * jsdom gives every element a zero-sized box, and it collapses every document
 * into one realm. So a widget that measures its own layout, or that talks to a
 * frame it owns, can pass 200 unit tests and still be broken in every browser —
 * which is exactly how `code-lab` shipped hanging on "Running…" forever.
 *
 * This runs against the REAL built playground, because that is also the host
 * that renders each demo inside a device-frame iframe: the second realm is not
 * a contrivance here, it is the shipping configuration.
 *
 * Deliberately NOT part of `pnpm check`: it needs a browser binary, so a
 * contributor without one would see the whole guarantee fail for a reason that
 * has nothing to do with their change. `pnpm e2e` is its own gate — run it when
 * you touch measurement, realms, iframes, sandboxes, or anything whose
 * behaviour jsdom only pretends to have.
 */
export default defineConfig({
  testDir: "./e2e",
  // Geometry assertions read a settled layout; retrying a real layout bug would
  // only make it intermittent instead of fixing it.
  retries: 0,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "list" : [["list"]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        viewport: { width: 1280, height: 900 },
        launchOptions: { executablePath },
      },
    },
  ],
  webServer: {
    // Against the built app, not the dev server: a widget that only works
    // before minification and tree-shaking is still a broken widget.
    command: "pnpm build && pnpm preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    // Never reuse: this suite tests a BUILD, so a server left over from an
    // earlier run happily serves the previous build and the whole pass reports
    // on code that is no longer in the tree. It cost one confusing red run.
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
