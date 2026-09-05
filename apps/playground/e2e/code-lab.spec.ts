import { expect, test } from "@playwright/test";

import { openWidget, watchErrors } from "./helpers";

/**
 * The regression that justifies this whole suite existing.
 *
 * `code-lab` runs each variant in a sandboxed iframe and reads the result back
 * over postMessage. jsdom never executes iframe scripts, so the unit suite can
 * only assert the sandbox is *configured* right — it cannot assert anything
 * ever runs. It didn't: the listener was attached to the ambient `window`,
 * while the sandbox posts to `parent`, which in the playground is the
 * device-frame document. Two realms, no error, every run stuck on "Running…".
 */
test.describe("CodeLab actually executes", () => {
  test("runs both variants and they differ", async ({ page }) => {
    const errors = watchErrors(page);
    const frame = await openWidget(page, "code-lab");

    const runs = frame.locator('[data-slot="code-lab-variant"] button');
    await expect(runs).toHaveCount(2);

    await runs.nth(0).click();
    await runs.nth(1).click();

    const consoles = frame.locator('[data-slot="code-lab-variant"] [role="status"]');

    // The buggy variant sums nothing because `forEach` does not await; the fix
    // sequences the same work. If these ever match, the lab teaches nothing.
    await expect(consoles.nth(0)).toHaveText(/^0$/, { timeout: 15_000 });
    await expect(consoles.nth(1)).toHaveText(/^60$/, { timeout: 15_000 });

    expect(errors.ours()).toEqual([]);
  });

  test("never leaves a run hanging on its 'running' state", async ({ page }) => {
    const frame = await openWidget(page, "code-lab");
    await frame.locator('[data-slot="code-lab-variant"] button').first().click();

    const pane = frame
      .locator('[data-slot="code-lab-variant"] [role="status"]')
      .first();
    // Whatever the copy or the locale, a finished run is not still announcing
    // itself as in progress — that was the exact shape of the realm bug.
    await expect(pane).not.toHaveText(/Running|Ejecutando/, { timeout: 15_000 });
  });

  test("isolates each variant in its own credential-less sandbox", async ({
    page,
  }) => {
    const frame = await openWidget(page, "code-lab");
    const sandboxes = await frame
      .locator('[data-slot="code-lab"] iframe')
      .evaluateAll((frames) =>
        frames.map((f) => f.getAttribute("sandbox")),
      );

    expect(sandboxes).toHaveLength(2);
    for (const value of sandboxes) {
      expect(value).toBe("allow-scripts");
      expect(value).not.toContain("allow-same-origin");
    }
  });
});
