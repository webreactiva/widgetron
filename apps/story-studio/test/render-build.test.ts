import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import { renderStory } from "../src/render/build";

/**
 * End-to-end guarantee for `story render`: a minimal document goes through
 * validate → resolve → inner Vite build and comes out as a self-contained
 * folder (index.html + hydration JS + compiled CSS with widgetron tokens).
 *
 * The temp appRoot lives INSIDE the package so the inner Vite build can
 * resolve react/@webreactiva/widgetron by walking up to node_modules.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(here, ".tmp-render");

const doc = {
  version: 1,
  meta: {
    title: "Render pipeline smoke",
    slug: "mini",
    lang: "en",
    description: "e2e fixture for the story render build",
  },
  story: {
    type: "storyline",
    props: {
      modules: [
        {
          title: "Only module",
          screens: [
            {
              type: "callout-box",
              props: { variant: "info", children: "It **renders**." },
            },
          ],
        },
      ],
    },
  },
};

afterAll(() => {
  fs.rmSync(appRoot, { recursive: true, force: true });
});

describe("story render pipeline", () => {
  it(
    "builds a self-contained folder from a story document",
    async () => {
      fs.rmSync(appRoot, { recursive: true, force: true });
      fs.mkdirSync(path.join(appRoot, "content"), { recursive: true });
      fs.writeFileSync(
        path.join(appRoot, "content", "mini.story.json"),
        JSON.stringify(doc, null, 2),
      );

      const outDir = await renderStory("mini", { appRoot });

      const html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");
      expect(html).toContain("Render pipeline smoke");
      // Static shell carries the module index before hydration.
      expect(html).toContain("Only module");

      const assets = fs.readdirSync(path.join(outDir, "assets"));
      const js = assets.filter((f) => f.endsWith(".js"));
      const css = assets.filter((f) => f.endsWith(".css"));
      expect(js.length).toBeGreaterThan(0);
      expect(css.length).toBeGreaterThan(0);

      // The compiled CSS must carry the widgetron token layer (proof that
      // the package-resolved @source/@import wiring worked).
      const cssText = fs.readFileSync(
        path.join(outDir, "assets", css[0]),
        "utf8",
      );
      expect(cssText).toContain("--primary");

      // The embedded document is the RESOLVED tree, cover title included.
      const jsText = js
        .map((f) => fs.readFileSync(path.join(outDir, "assets", f), "utf8"))
        .join("\n");
      expect(jsText).toContain("Render pipeline smoke");
    },
    180_000,
  );

  it("rejects an invalid document with actionable errors", async () => {
    fs.mkdirSync(path.join(appRoot, "content"), { recursive: true });
    fs.writeFileSync(
      path.join(appRoot, "content", "broken.story.json"),
      JSON.stringify({ version: 1, meta: { title: "" } }),
    );
    await expect(renderStory("broken", { appRoot })).rejects.toThrow(
      /Invalid document/,
    );
  });
});
