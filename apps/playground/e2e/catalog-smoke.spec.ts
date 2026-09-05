import { expect, test } from "@playwright/test";

import { isOurProblem } from "./helpers";

/**
 * "Open it and use it" for the whole catalog.
 *
 * A widget can typecheck, pass its unit tests and still throw the first time a
 * real browser lays it out — an effect that reads a measurement, a lazy import
 * that resolves differently after tree-shaking, an observer jsdom stubbed away.
 * This walks every entry in the playground and fails on anything the library
 * itself logs or throws.
 *
 * Errors from hosts the sandbox blocks (Google Fonts, the Iconify API) are
 * filtered by host, not muted wholesale, so a same-origin failure stays loud.
 */
test("every widget in the catalog renders without errors", async ({ page }) => {
  test.setTimeout(180_000);

  const problems: string[] = [];
  let current = "(startup)";

  page.on("pageerror", (e) => problems.push(`${current}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    const where = m.location()?.url ?? "";
    if (isOurProblem(text) && isOurProblem(where)) {
      problems.push(`${current}: ${text}`);
    }
  });

  await page.goto("/");
  const ids = await page
    .locator("[data-widget-id]")
    .evaluateAll((els) =>
      els.map((e) => (e as HTMLElement).dataset.widgetId!).filter(Boolean),
    );
  // If the sidebar ever stops exposing ids this test would silently pass on an
  // empty list, which is the failure mode a smoke test must not have.
  expect(ids.length).toBeGreaterThan(50);

  const empty: string[] = [];
  for (const id of ids) {
    current = id;
    await page.click(`[data-widget-id="${id}"]`);
    const handle = await page.waitForSelector("iframe");
    const frame = await handle.contentFrame();
    if (!frame) throw new Error(`no device frame for "${id}"`);

    // Something with real ink on it — a demo that renders to nothing is a
    // broken demo even when it throws nothing.
    const painted = await frame
      .evaluate(() => document.body?.getBoundingClientRect().height ?? 0)
      .catch(() => 0);
    if (painted < 20) empty.push(id);
  }

  expect(empty, "widgets whose demo rendered nothing").toEqual([]);
  expect(problems, "errors the library is responsible for").toEqual([]);
});
