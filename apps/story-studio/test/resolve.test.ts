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
  it("injects settings.challenge as the storyline `challenge` prop", () => {
    const resolved = resolveStory(doc({ challenge: { label: "Tu delta" } }));
    expect(resolved.props!.challenge).toBe("Tu delta");
    // An explicit prop wins over the setting.
    const explicit = doc({ challenge: { label: "Tu delta" } });
    explicit.story.props!.challenge = "Otro";
    expect(resolveStory(explicit).props!.challenge).toBe("Otro");
  });

  it("injects settings.lives as the storyline `lives` prop", () => {
    const resolved = resolveStory(doc({ lives: { total: 3, label: "Vidas" } }));
    expect(resolved.props!.lives).toEqual({ total: 3, label: "Vidas" });
    // An explicit prop wins over the setting.
    const explicit = doc({ lives: { total: 3 } });
    explicit.story.props!.lives = { total: 5 };
    expect(resolveStory(explicit).props!.lives).toEqual({ total: 5 });
    // Absent setting → no injection.
    expect(resolveStory(doc()).props!.lives).toBeUndefined();
  });

  it("without settings only the cover metadata is injected", () => {
    const d = doc();
    const resolved = resolveStory(d);
    expect(resolved).toEqual({
      ...d.story,
      // minutes: the cover time promise, estimated from the document's copy
      // (10 words here → 1 min at 220 wpm).
      props: { ...d.story.props, title: d.meta.title, minutes: 1 },
    });
  });

  it("estimates cover minutes from the document's copy, without overriding an explicit prop", () => {
    expect(resolveStory(doc()).props!.minutes).toBe(1);
    const explicit = doc();
    explicit.story.props!.minutes = 12;
    expect(resolveStory(explicit).props!.minutes).toBe(12);
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

  it("the end CTA becomes the storyline outro (after the finale), the end surprise stays the last screen", () => {
    const resolved = resolveStory(
      doc({
        surprises: { end: surprise("end") },
        cta: { kind: "link", title: "Go", url: "https://example.com" },
      }),
    );
    const all = flat(resolved);
    expect(all[all.length - 1].type).toBe("surprise");
    const outro = resolved.props!.outro as WidgetNode;
    expect(outro.type).toBe("cta");
    expect(outro.props).toMatchObject({
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

  it("clamps an out-of-range placement to the end (outro)", () => {
    const resolved = resolveStory(
      doc({ cta: { kind: "link", title: "Go", url: "https://example.com", placement: 99 } }),
    );
    expect((resolved.props!.outro as WidgetNode).type).toBe("cta");
  });
});
