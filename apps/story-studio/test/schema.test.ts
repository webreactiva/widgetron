import { describe, expect, it } from "vitest";

import { validateEnvelope } from "../src/engine/core";

const minimal = () => ({
  version: 1,
  meta: { title: "T", slug: "t" },
  story: { type: "storyline", props: { modules: [] } },
});

describe("story document envelope", () => {
  it("accepts a minimal valid document", () => {
    const result = validateEnvelope(minimal());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a non-kebab slug with a path", () => {
    const doc = { ...minimal(), meta: { title: "T", slug: "Not A Slug" } };
    const result = validateEnvelope(doc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith("meta.slug"))).toBe(true);
  });

  it('requires `url` for a "link" CTA', () => {
    const doc = {
      ...minimal(),
      settings: { cta: { kind: "link", title: "Go" } },
    };
    const result = validateEnvelope(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("settings.cta.url"),
    );
  });

  it('requires `privacyUrl` AND `submitEndpoint` for an "email-form" CTA', () => {
    const doc = {
      ...minimal(),
      settings: { cta: { kind: "email-form", title: "Join" } },
    };
    const result = validateEnvelope(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("settings.cta.privacyUrl"),
    );
    expect(result.errors).toContainEqual(
      expect.stringContaining("settings.cta.submitEndpoint"),
    );
  });

  it("accepts a complete email-form CTA", () => {
    const doc = {
      ...minimal(),
      settings: {
        cta: {
          kind: "email-form",
          title: "Join",
          privacyUrl: "https://example.com/privacy",
          submitEndpoint: "https://example.com/subscribe",
        },
      },
    };
    expect(validateEnvelope(doc).valid).toBe(true);
  });

  it("rejects a CTA without title (author copy is mandatory)", () => {
    const doc = {
      ...minimal(),
      settings: { cta: { kind: "link", url: "https://example.com" } },
    };
    const result = validateEnvelope(doc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining("settings.cta.title"),
    );
  });
});
