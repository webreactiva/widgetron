import { expect, test } from "@playwright/test";

import { watchErrors } from "./helpers";

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

  const errors = watchErrors(page);
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
    await page.click(`[data-widget-id="${id}"]`);
    const handle = await page.waitForSelector("iframe");
    const frame = await handle.contentFrame();
    if (!frame) throw new Error(`no device frame for "${id}"`);

    // Every widget roots itself on a `data-slot`, so waiting for one is both
    // the "it rendered" assertion and the wait the next iteration needs.
    //
    // Measuring the frame's HEIGHT instead — which is what this did first —
    // asserts nothing: ViewportFrame gives the demo `min-h-64`, so the body is
    // never shorter than 256px and the check could not fail on any input. If a
    // widget throws while rendering, React unmounts its tree and no data-slot
    // ever appears; that is the case this has to catch.
    const rendered = await frame
      .waitForFunction(
        () => document.querySelectorAll("[data-slot]").length > 0,
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);
    if (!rendered) empty.push(id);
  }

  // Reported, not gated: with no egress every third-party fetch fails, and a
  // broken demo image is a content problem rather than a library one.
  const external = errors.external();
  if (external.length > 0) {
    console.log(`${external.length} cross-origin fetch(es) failed (not gated):`);
    for (const line of [...new Set(external)].slice(0, 5)) console.log(`  ${line}`);
  }

  expect(empty, "widgets whose demo rendered nothing").toEqual([]);
  expect(errors.ours(), "errors in code the app itself serves").toEqual([]);
});
