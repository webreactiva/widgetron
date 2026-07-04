import { describe, expect, it } from "vitest";

import { resolveStory, type StoryDocument, type WidgetNode } from "../src/engine/core";

const screen = (n: number): WidgetNode => ({
  type: "prose",
  props: { children: `screen ${n}` },
});

/** 2 modules: 3 + 2 = 5 screens. */
function doc(settings?: StoryDocument["settings"]): StoryDocument {
  return {
    version: 1,
    meta: { title: "T", slug: "t" },
    settings,
    story: {
      type: "storyline",
      props: {
        modules: [
          { title: "M1", screens: [screen(1), screen(2), screen(3)] },
          { title: "M2", screens: [screen(4), screen(5)] },
        ],
      },
    },
  };
}

const surprise = (id: string): WidgetNode => ({
  type: "surprise",
  props: { content: { type: "prose", props: { children: id } } },
});

type Mod = { screens: WidgetNode[] };
const modules = (story: WidgetNode) => story.props!.modules as Mod[];
const flat = (story: WidgetNode) => modules(story).flatMap((m) => m.screens);

describe("resolveStory (D-004: injection happens at build time)", () => {
  it("without settings only the cover metadata is injected", () => {
    const d = doc();
    const resolved = resolveStory(d);
    expect(resolved).toEqual({
      ...d.story,
      props: { ...d.story.props, title: d.meta.title },
    });
  });

  it("injects meta.title/description as the storyline cover, without overriding explicit props", () => {
    const d = doc();
    d.meta.description = "Lead line";
    expect(resolveStory(d).props).toMatchObject({
      title: "T",
      description: "Lead line",
    });

    const explicit = doc();
    explicit.story.props!.title = "Custom cover";
    expect(resolveStory(explicit).props!.title).toBe("Custom cover");
  });

  it("does not mutate the input document", () => {
    const d = doc({ surprises: { end: surprise("end") } });
    const before = JSON.parse(JSON.stringify(d));
    resolveStory(d);
    expect(d).toEqual(before);
  });

  it("inserts `mid` after screen ⌈N/2⌉ (5 screens → after the 3rd)", () => {
    const resolved = resolveStory(doc({ surprises: { mid: surprise("mid") } }));
    const m1 = modules(resolved)[0].screens;
    expect(m1).toHaveLength(4);
    expect(m1[3].type).toBe("surprise");
    expect(flat(resolved)).toHaveLength(6);
  });

  it("appends `end` as the last screen of the last module", () => {
    const resolved = resolveStory(doc({ surprises: { end: surprise("end") } }));
    const all = flat(resolved);
    expect(all[all.length - 1].type).toBe("surprise");
  });

  it("merges `mid` into the end with fewer than 3 screens", () => {
    const d: StoryDocument = {
      version: 1,
      meta: { title: "T", slug: "t" },
      settings: { surprises: { mid: surprise("mid"), end: surprise("end") } },
      story: {
        type: "storyline",
        props: { modules: [{ title: "M1", screens: [screen(1), screen(2)] }] },
      },
    };
    const all = flat(resolveStory(d));
    expect(all).toHaveLength(4);
    expect(all[2].type).toBe("surprise"); // mid, merged
    expect(all[3].type).toBe("surprise"); // end
  });

  it("the CTA is always the very last screen (after the end surprise)", () => {
    const resolved = resolveStory(
      doc({
        surprises: { end: surprise("end") },
        cta: { kind: "link", title: "Go", url: "https://example.com" },
      }),
    );
    const all = flat(resolved);
    expect(all[all.length - 2].type).toBe("surprise");
    expect(all[all.length - 1].type).toBe("cta");
    expect(all[all.length - 1].props).toMatchObject({
      variant: "link",
      title: "Go",
      url: "https://example.com",
    });
  });

  it("numeric CTA placement counts over the ORIGINAL screens (mid never shifts it)", () => {
    const resolved = resolveStory(
      doc({
        surprises: { mid: surprise("mid") },
        cta: { kind: "link", title: "Go", url: "https://example.com", placement: 2 },
      }),
    );
    const m1 = modules(resolved)[0].screens;
    // original m1: s1 s2 s3 → cta after s2, mid after s3 (⌈5/2⌉=3)
    expect(m1.map((s) => s.type)).toEqual([
      "prose",
      "prose",
      "cta",
      "prose",
      "surprise",
    ]);
  });

  it("clamps an out-of-range placement to the end", () => {
    const resolved = resolveStory(
      doc({ cta: { kind: "link", title: "Go", url: "https://example.com", placement: 99 } }),
    );
    const all = flat(resolved);
    expect(all[all.length - 1].type).toBe("cta");
  });
});
