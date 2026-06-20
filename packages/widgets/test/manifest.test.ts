import { describe, expect, it } from "vitest";

import {
  widgetManifest,
  getWidgetManifestJSON,
  validateWidgetNode,
  validateWidgetTree,
  widgetRegistry,
} from "@/lib/registry";

describe("enriched manifest", () => {
  it("lists every registered type", () => {
    const types = widgetManifest.map((m) => m.type).sort();
    expect(types).toEqual(Object.keys(widgetRegistry).sort());
  });

  it("carries an AI-oriented whenToUse for widgets with metadata", () => {
    const quiz = widgetManifest.find((m) => m.type === "quiz");
    expect(quiz?.whenToUse).toMatch(/Reach for this/i);
    expect(quiz?.category).toBe("Interactive");
  });

  it("serializes zod schemas to JSON Schema", () => {
    const json = getWidgetManifestJSON();
    const quiz = json.find((m) => m.type === "quiz");
    const schema = quiz?.schema as { type?: string; properties?: object };
    expect(schema?.type).toBe("object");
    expect(schema?.properties).toHaveProperty("question");
    expect(schema?.properties).toHaveProperty("options");
  });

  it("ships a valid example for every widget that has a schema", () => {
    for (const m of widgetManifest) {
      if (!m.schema || !m.example) continue;
      const result = validateWidgetNode(m.example);
      expect(result.errors, `${m.type} example`).toEqual([]);
    }
  });
});

describe("validateWidgetNode", () => {
  it("accepts well-formed props", () => {
    const result = validateWidgetNode({
      type: "quiz",
      props: {
        question: "Q?",
        options: [{ text: "a" }, { text: "b", correct: true }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects malformed props with a path", () => {
    const result = validateWidgetNode({
      type: "quiz",
      props: { question: "Q?", options: [{ text: "only one" }] },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/options/);
  });

  it("flags unknown types", () => {
    const result = validateWidgetNode({ type: "does-not-exist" });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Unknown widget type/);
  });
});

describe("validateWidgetTree", () => {
  it("validates nested screens of a storyline", () => {
    const bad = {
      type: "storyline",
      props: {
        modules: [
          {
            title: "M",
            screens: [{ type: "quiz", props: { question: "Q?", options: [] } }],
          },
        ],
      },
    };
    const result = validateWidgetTree(bad);
    expect(result.valid).toBe(false);
    // the error should point through the nested quiz
    expect(result.errors.join(" ")).toMatch(/quiz/);
  });
});
