import { describe, expect, it } from "vitest";

import {
  authoringGuide,
  authoringGuideWidgetTypes,
  getAuthoringGuideJSON,
} from "@/lib/authoring";
import { widgetRegistry } from "@/lib/registry";

/**
 * The authoring guide is data an agent acts on, so its widget names have to be
 * real. A renamed or removed widget must break here rather than silently
 * telling a generator to emit a type that no longer resolves.
 */
describe("authoring guide", () => {
  it("only ever names widget types that exist in the registry", () => {
    const unknown = authoringGuideWidgetTypes().filter(
      (type) => !(type in widgetRegistry),
    );
    expect(unknown).toEqual([]);
  });

  it("covers every check widget the mechanic table promises", () => {
    for (const mechanic of authoringGuide.checkMechanics) {
      expect(widgetRegistry, mechanic.widget).toHaveProperty(mechanic.widget);
    }
  });

  it("gives each source shape somewhere to start and a check to end on", () => {
    for (const shape of authoringGuide.sourceShapes) {
      expect(shape.reach.length, shape.shape).toBeGreaterThan(0);
      expect(shape.checks.length, shape.shape).toBeGreaterThan(0);
    }
  });

  it("never recommends and warns against the same widget for one shape", () => {
    for (const shape of authoringGuide.sourceShapes) {
      const recommended = new Set([...shape.reach, ...shape.checks]);
      const contradictions = shape.avoid.filter((t) => recommended.has(t));
      expect(contradictions, shape.shape).toEqual([]);
    }
  });

  it("gives every rule the reason it exists — the reason is what transfers", () => {
    for (const rule of [
      ...authoringGuide.nonNegotiables,
      ...authoringGuide.sequencing,
    ]) {
      expect(rule.why.length, rule.id).toBeGreaterThan(40);
    }
  });

  it("serializes to plain JSON without losing anything", () => {
    const json = getAuthoringGuideJSON();
    expect(json).toEqual(authoringGuide);
    // …and hands back a copy, so a consumer can't mutate the shared guide.
    json.sourceShapes.length = 0;
    expect(authoringGuide.sourceShapes.length).toBeGreaterThan(0);
  });
});
