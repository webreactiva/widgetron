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
 * Console noise this sandbox produces no matter what the widgets do: the
 * environment's proxy refuses Google Fonts and the Iconify icon API. Filtering
 * by host rather than by message keeps a real same-origin failure loud.
 */
const EXTERNAL = [
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "api.iconify.design",
  "api.simplesvg.com",
  "api.unisvg.com",
];

export function isOurProblem(text: string): boolean {
  return !EXTERNAL.some((host) => text.includes(host));
}

/**
 * Collect page errors and console errors that are actually ours. Returns a
 * getter rather than an array so a test reads it after the interactions.
 */
export function watchErrors(page: Page): () => string[] {
  const seen: string[] = [];
  page.on("pageerror", (e) => seen.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // A failed request logs a generic "Failed to load resource"; the URL is on
    // the message's location, so check both.
    const where = m.location()?.url ?? "";
    if (isOurProblem(text) && isOurProblem(where)) seen.push(`${text} @ ${where}`);
  });
  return () => seen;
}
