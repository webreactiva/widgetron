import type { Frame, Page } from "@playwright/test";

/**
 * Every demo renders inside the playground's device-frame iframe, so a test
 * that queries `page` is querying the shell, not the widget. This returns the
 * frame the widget actually lives in — and that second document is the point,
 * not an inconvenience: it is where realm bugs surface.
 */
export async function openWidget(page: Page, id: string): Promise<Frame> {
  await page.goto("/");
  await page.click(`[data-widget-id="${id}"]`);
  const handle = await page.waitForSelector("iframe");
  const frame = await handle.contentFrame();
  if (!frame) throw new Error(`no device frame for "${id}"`);
  await frame.waitForSelector(`[data-slot="${id}"]`);
  // Effects and the first ResizeObserver callback land after paint.
  await page.waitForTimeout(400);
  return frame;
}

/**
 * Is this failure the library's, or the network's?
 *
 * The suite gates on the first and only reports the second. Anything fetched
 * from another ORIGIN — webfonts, the Iconify API, basemap tiles, demo imagery —
 * is a dependency, not code under test, and in a sandbox with no egress every
 * one of them fails. An allowlist of hosts was the first attempt and it grew on
 * every run, which is the tell: each entry is a thing the suite quietly stopped
 * watching. Same-origin is the line that does not move.
 *
 * The browser logs a generic "Failed to load resource" whatever the host, so
 * this reads the resource URL rather than the message.
 */
export function isSameOrigin(url: string, origin: string): boolean {
  if (!url) return true; // no URL to place it — assume it is ours and be loud
  try {
    return new URL(url).origin === origin;
  } catch {
    return true;
  }
}

export interface ErrorWatch {
  /** Failures in code served by the app itself. The suite fails on these. */
  ours: () => string[];
  /** Cross-origin fetch failures. Reported, never fatal. */
  external: () => string[];
}

/** Split what the page logs into what we own and what we merely depend on. */
export function watchErrors(page: Page, origin = "http://localhost:4173"): ErrorWatch {
  const ours: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (e) => ours.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = m.location()?.url ?? "";
    (isSameOrigin(url, origin) ? ours : external).push(
      `${m.text()}${url ? ` @ ${url}` : ""}`,
    );
  });
  return { ours: () => ours, external: () => external };
}
