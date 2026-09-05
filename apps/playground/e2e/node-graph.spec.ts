import { expect, test } from "@playwright/test";

import { openWidget, watchErrors } from "./helpers";

/**
 * `node-graph` draws its arrows from the boxes' MEASURED positions. jsdom
 * reports every box as 0×0 at 0,0, so its unit tests can only count paths and
 * check the labels stayed HTML — the geometry, which is the entire reason the
 * widget exists, is unverifiable there.
 */
test.describe("NodeGraph geometry", () => {
  test("draws real curves between the real boxes", async ({ page }) => {
    const errors = watchErrors(page);
    const frame = await openWidget(page, "node-graph");

    const geometry = await frame.evaluate(() => {
      const root = document.querySelector('[data-slot="node-graph"]')!;
      const paths = [
        ...root.querySelectorAll<SVGPathElement>('[data-slot="node-graph-edge"]'),
      ];
      const rows = new Set(
        [...root.querySelectorAll(".grid > div")].map((d) =>
          Math.round(d.getBoundingClientRect().top),
        ),
      );
      return {
        count: paths.length,
        lengths: paths.map((p) => p.getTotalLength()),
        markers: paths.map((p) => p.getAttribute("marker-end")),
        rows: rows.size,
      };
    });

    expect(geometry.count).toBe(4);
    // Zero-length paths are what a layout that never got measured produces.
    for (const length of geometry.lengths) expect(length).toBeGreaterThan(20);
    // The demo places a node on a second row; a graph collapsed to one line
    // means row/col were ignored and it is a flow-diagram with extra steps.
    expect(geometry.rows).toBeGreaterThanOrEqual(2);
    for (const marker of geometry.markers) {
      expect(marker).toMatch(/^url\(#wgt-arrow-/);
    }

    expect(errors.ours()).toEqual([]);
  });

  test("the arrows follow when the wording changes", async ({ page }) => {
    const frame = await openWidget(page, "node-graph");
    const edge = '[data-slot="node-graph-edge"]';
    const before = await frame.locator(edge).first().getAttribute("d");

    // The load-bearing claim of the hybrid: nothing is kept in sync by hand, so
    // making a box taller has to move the curve that lands on it.
    await frame.evaluate(() => {
      const box = document.querySelector('[data-slot="node-graph"] .grid > div');
      box!.querySelector("span")!.textContent =
        "A considerably longer node label than the one before it";
    });
    await page.waitForTimeout(500);

    const after = await frame.locator(edge).first().getAttribute("d");
    expect(after).not.toBe(before);
  });

  test("puts the edge labels on the curve as HTML, never as SVG text", async ({
    page,
  }) => {
    const frame = await openWidget(page, "node-graph");
    const root = frame.locator('[data-slot="node-graph"]');

    // SVG <text> cannot render HTML, which is the whole reason the labels are
    // chips: `GET \`/product/42\`` has to come out as a real <code>.
    await expect(root.locator("svg text")).toHaveCount(0);
    await expect(root.locator("code").first()).toHaveText("/product/42");

    const placed = await root.locator("span[style*='left']").evaluateAll((els) =>
      els.map((e) => ({
        left: parseFloat((e as HTMLElement).style.left),
        top: parseFloat((e as HTMLElement).style.top),
      })),
    );
    expect(placed.length).toBeGreaterThanOrEqual(3);
    for (const chip of placed) {
      expect(chip.left).toBeGreaterThan(0);
      expect(chip.top).toBeGreaterThan(0);
    }
  });
});
