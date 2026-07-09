import { describe, expect, it } from "vitest";

import { lintStoryDocument } from "../src/engine/lint";

const meta = {
  title: "Lint fixture",
  slug: "lint-fixture",
  lang: "en",
  description: "pacing lint test fixture",
};

const screen = (type: string) => ({ type, props: {} });

/** 3 modules × 3 screens, no repeats, 4 groups, a diagram, a quiz in the
 * second half, closing on a checklist — every hard rule satisfied. */
const cleanDoc = {
  version: 1,
  meta,
  story: {
    type: "storyline",
    props: {
      modules: [
        {
          title: "One",
          screens: ["prose", "mermaid-diagram", "quiz"].map(screen),
        },
        {
          title: "Two",
          screens: ["callout-box", "flashcards", "group-chat"].map(screen),
        },
        {
          title: "Three",
          screens: ["data-chart", "quiz", "checklist"].map(screen),
        },
      ],
    },
  },
};

/** 2 modules, all prose with adjacent repeats, no diagram, no quiz. */
const hostileDoc = {
  version: 1,
  meta,
  story: {
    type: "storyline",
    props: {
      modules: [
        { title: "One", screens: ["prose", "prose"].map(screen) },
        { title: "Two", screens: ["prose", "quote"].map(screen) },
      ],
    },
  },
};

describe("story pacing lint", () => {
  it("passes a well-paced story with no findings", () => {
    const result = lintStoryDocument(cleanDoc);
    expect(result.ok).toBe(true);
    expect(result.findings).toHaveLength(0);
    expect(result.score).toHaveLength(9);
  });

  it("catches what schema validation misses on a hostile story", () => {
    const result = lintStoryDocument(hostileDoc);
    expect(result.ok).toBe(false);
    const rules = new Set(
      result.findings.filter((f) => f.severity === "error").map((f) => f.rule),
    );
    for (const rule of [
      "module-count",
      "no-repeat",
      "variety",
      "diagram",
      "prose-quota",
      "quiz-second-half",
    ]) {
      expect(rules).toContain(rule);
    }
  });

  it("warns on a long static streak and a reused visual metaphor", () => {
    const result = lintStoryDocument({
      version: 1,
      meta,
      story: {
        type: "storyline",
        props: {
          modules: [
            {
              title: "One",
              // 5 static screens before any interaction → cadence warning.
              screens: [
                { type: "prose", props: {} },
                { type: "callout-box", props: {} },
                { type: "quote", props: {} },
                { type: "infographic", props: { layout: "funnel" } },
                { type: "step-cards", props: {} },
              ],
            },
            {
              title: "Two",
              screens: [
                { type: "quiz", props: {} },
                // same infographic layout again → visual-metaphor warning.
                { type: "infographic", props: { layout: "funnel" } },
                { type: "checklist", props: {} },
              ],
            },
          ],
        },
      },
    });
    const warnRules = result.findings
      .filter((f) => f.severity === "warning")
      .map((f) => f.rule);
    expect(warnRules).toContain("cadence");
    expect(warnRules).toContain("visual-metaphor");
  });

  it("flags two widgets that share a localStorage key", () => {
    const result = lintStoryDocument({
      version: 1,
      meta,
      story: {
        type: "storyline",
        props: {
          modules: [
            {
              title: "One",
              screens: [
                { type: "checklist", props: { id: "dup", items: ["a"] } },
                { type: "prose", props: {} },
                { type: "checklist", props: { id: "dup", items: ["b"] } },
              ],
            },
          ],
        },
      },
    });
    const collisions = result.findings.filter((f) => f.rule === "persistence-collision");
    expect(collisions).toHaveLength(1);
    expect(collisions[0].message).toContain("widgetron-checklist:dup");
  });

  it("does not flag distinct storage keys", () => {
    const result = lintStoryDocument({
      version: 1,
      meta,
      story: {
        type: "storyline",
        props: {
          modules: [
            {
              title: "One",
              screens: [
                { type: "checklist", props: { id: "a", items: ["x"] } },
                { type: "prose", props: {} },
                { type: "checklist", props: { id: "b", items: ["y"] } },
              ],
            },
          ],
        },
      },
    });
    expect(result.findings.some((f) => f.rule === "persistence-collision")).toBe(false);
  });

  it("skips pacing rules for a non-storyline root", () => {
    const result = lintStoryDocument({
      version: 1,
      meta,
      story: { type: "quiz", props: { question: "q", options: [] } },
    });
    expect(result.ok).toBe(true);
    expect(result.findings[0]?.rule).toBe("root");
  });
});
