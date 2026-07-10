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

  it("warns on a minute-chipped quote without a clip only when the doc has audio", () => {
    const quoteAt = {
      type: "quote",
      props: { children: "q", timestamp: "23:14" },
    };
    const story = {
      type: "storyline",
      props: { modules: [{ title: "One", screens: [quoteAt] }] },
    };
    const withAudio = lintStoryDocument({
      version: 1,
      meta,
      audio: { full: "https://example.com/e315.mp3" },
      story,
    });
    expect(withAudio.findings.some((f) => f.rule === "audio-pending")).toBe(true);

    const withoutAudio = lintStoryDocument({ version: 1, meta, story });
    expect(withoutAudio.findings.some((f) => f.rule === "audio-pending")).toBe(false);
  });

  it("validates the briefing mold: hard length cap and a required quiz", () => {
    const story = (screens: string[]) => ({
      type: "storyline",
      props: {
        modules: [
          { title: "Claves", screens: screens.map(screen) },
          { title: "Reto", screens: ["callout-box", "prose"].map(screen) },
          { title: "Fuentes", screens: ["resource-list", "cta"].map(screen) },
        ],
      },
    });
    const long = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "briefing" },
      // 6 + 2 + 2 = 10 screens (> 9), and no quiz anywhere.
      story: story(["data-chart", "quote", "flow-diagram", "callout-box", "prose", "timeline"]),
    });
    const rules = long.findings.filter((f) => f.rule === "format-briefing");
    expect(rules.some((f) => f.message.includes("screens"))).toBe(true);
    expect(rules.some((f) => f.message.includes("quiz"))).toBe(true);

    const fit = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "briefing" },
      story: story(["data-chart", "quote", "quiz"]),
    });
    expect(fit.findings.some((f) => f.rule === "format-briefing")).toBe(false);
  });

  it("validates the entrevista mold: guest card and enough quotes", () => {
    const result = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "entrevista" },
      story: {
        type: "storyline",
        props: {
          modules: [
            { title: "Personaje", screens: ["timeline", "quote"].map(screen) },
            { title: "Ideas", screens: ["flashcards", "quiz"].map(screen) },
            { title: "Seguir", screens: ["resource-list", "cta"].map(screen) },
          ],
        },
      },
    });
    const msgs = result.findings.filter((f) => f.rule === "format-entrevista");
    expect(msgs.some((f) => f.message.includes("profile-card"))).toBe(true);
    expect(msgs.some((f) => f.message.includes("quote"))).toBe(true);
  });

  it("validates the juego mold: requires lives and enough scored quizzes", () => {
    const threeQuizzes = {
      type: "storyline",
      props: {
        modules: [
          { title: "M1", screens: ["prose", "quiz"].map(screen) },
          { title: "M2", screens: ["callout-box", "quiz"].map(screen) },
          { title: "M3", screens: ["data-chart", "quiz"].map(screen) },
        ],
      },
    };

    // No settings.lives — the format IS the mechanic.
    const noLives = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "juego" },
      story: threeQuizzes,
    });
    expect(
      noLives.findings.some(
        (f) => f.rule === "format-juego" && f.message.includes("settings.lives"),
      ),
    ).toBe(true);

    // Lives present but too few scored quizzes.
    const fewQuizzes = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "juego" },
      settings: { lives: { total: 3 } },
      story: {
        type: "storyline",
        props: {
          modules: [
            { title: "M1", screens: ["prose", "quiz"].map(screen) },
            { title: "M2", screens: ["callout-box", "quote"].map(screen) },
            { title: "M3", screens: ["data-chart", "checklist"].map(screen) },
          ],
        },
      },
    });
    expect(
      fewQuizzes.findings.some(
        (f) => f.rule === "format-juego" && /quiz/.test(f.message),
      ),
    ).toBe(true);

    // Too many lives → warning that game-over is barely reachable.
    const soft = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "juego" },
      settings: { lives: { total: 5 } },
      story: threeQuizzes,
    });
    expect(
      soft.findings.some(
        (f) => f.rule === "format-juego" && f.severity === "warning",
      ),
    ).toBe(true);

    // Well-formed: 3 quizzes, lives below that → no format-juego findings.
    const fit = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "juego" },
      settings: { lives: { total: 2 } },
      story: threeQuizzes,
    });
    expect(fit.findings.some((f) => f.rule === "format-juego")).toBe(false);
  });

  it("warns on an unknown format", () => {
    const result = lintStoryDocument({
      version: 1,
      meta: { ...meta, format: "opera" },
      story: cleanDoc.story,
    });
    expect(result.findings.some((f) => f.rule === "format")).toBe(true);
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
