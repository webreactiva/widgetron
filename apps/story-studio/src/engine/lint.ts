import { validateEnvelope, type WidgetNode } from "./schema";

/**
 * Story lint — the pacing / repetition / variety gate.
 *
 * `validateStoryDocument` checks the envelope and every widget's schema, but
 * NOT rhythm: a story with 5 `prose` in a row, 0 diagrams and 2 modules
 * validates clean. Those rules live only as a generation contract in the
 * `podcast-to-story` skill (SKILL.md + references/widget-guide.md). This turns
 * that trust contract into a check that runs in the CLI and in CI.
 *
 * It walks the flattened `story.props.modules[].screens[].type` sequence and
 * applies the skill's hard minimums. Errors fail the gate; warnings are
 * advisory. Categories come from the live widget manifest — no hardcoded
 * taxonomy to drift.
 */

export type LintSeverity = "error" | "warning";

export interface LintFinding {
  severity: LintSeverity;
  rule: string;
  message: string;
}

export interface StoryLint {
  /** No errors (warnings are allowed). */
  ok: boolean;
  findings: LintFinding[];
  /** One line per screen — the "partitura" for visual inspection. */
  score: string[];
}

// The "≥1 diagram" rule counts ONLY these four — narrower than the
// "Diagrams & data" category, which also holds compare-slider/hotspots.
const DIAGRAM_TYPES = new Set([
  "mermaid-diagram",
  "flow-diagram",
  "infographic",
  "data-chart",
]);
// Connective tissue for the prose-quota rule.
const TEXT_TYPES = new Set(["prose", "glossary-text"]);
// Keepsake closers.
const KEEPSAKE_TYPES = new Set(["checklist", "prompt-template"]);

// Widgets that persist under a RAW `storageKey` (no prefix). checklist and
// storyline namespace their keys instead — see persistenceKeyOf. These strings
// mirror the widget code; keep them in sync.
const RAW_STORAGE_TYPES = new Set(["profile-quiz", "profile-provider", "audio-clip"]);

/** The exact localStorage key a widget writes, or null if it doesn't persist. */
function persistenceKeyOf(node: WidgetNode): string | null {
  const p = (node.props ?? {}) as Record<string, unknown>;
  if (node.type === "checklist" && typeof p.id === "string") {
    return `widgetron-checklist:${p.id}`;
  }
  if (node.type === "storyline" && typeof p.storageKey === "string") {
    return `wgt-storyline:${p.storageKey}`;
  }
  if (RAW_STORAGE_TYPES.has(node.type) && typeof p.storageKey === "string") {
    return p.storageKey;
  }
  return null;
}

// type → widget group, mirroring the `category` field on each widget's
// .meta.ts. Kept static so the lint stays pure-Node (loading the React widget
// registry just to read categories broke the test runner and is overkill).
// ponytail: an unmapped type counts as its own group — safe for the variety
// check; only DIAGRAM_TYPES above is correctness-critical. Re-sync by hand when
// adding a widget (mirror its meta `category`).
const CATEGORY: Record<string, string> = {};
const group = (cat: string, ...types: string[]) => {
  for (const t of types) CATEGORY[t] = cat;
};
group(
  "Text & layout",
  "callout-box", "code-translation", "glossary-term", "glossary-text",
  "pattern-card", "profile-card", "prose", "quote", "resource-list",
  "section-header", "step-cards", "timeline",
);
group(
  "Interactive",
  "checklist", "decision-tree", "drag-and-drop", "fill-in-the-blanks",
  "flashcards", "predict-output", "quiz", "spot-the-bug", "surprise",
);
group(
  "Diagrams & data",
  "compare-slider", "data-chart", "flow-diagram", "hotspots",
  "infographic", "mermaid-diagram",
);
group("Reactive", "frame-stepper", "group-chat", "scrubber", "tangle-text", "terminal-sim");
group("AI & personalization", "profile-gate", "profile-provider", "profile-quiz", "prompt-template");
group("Media", "audio-clip", "figure", "video-clip");
group("Compositions", "scrollytelling", "storyline");
group("Conversion", "cta");

interface StoryModule {
  title?: unknown;
  subtitle?: unknown;
  screens?: WidgetNode[];
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function lintStoryDocument(input: unknown): StoryLint {
  const findings: LintFinding[] = [];
  const err = (rule: string, message: string) =>
    findings.push({ severity: "error", rule, message });
  const warn = (rule: string, message: string) =>
    findings.push({ severity: "warning", rule, message });

  // Only lint structurally-valid documents — `story validate` is the gate for
  // shape; lint assumes it passed.
  const envelope = validateEnvelope(input);
  if (!envelope.valid || !envelope.document) {
    return {
      ok: false,
      findings: [
        {
          severity: "error",
          rule: "envelope",
          message: "document failed schema validation — run `story validate` first",
        },
      ],
      score: [],
    };
  }
  const doc = envelope.document;

  // Pacing rules target the storyline root (the AI-generation surface).
  if (doc.story.type !== "storyline") {
    return {
      ok: true,
      findings: [
        {
          severity: "warning",
          rule: "root",
          message: `root is "${doc.story.type}", not a storyline — pacing rules skipped`,
        },
      ],
      score: [],
    };
  }

  const modules = (doc.story.props?.modules ?? []) as StoryModule[];
  const categoryOf = (t: string): string => CATEGORY[t] ?? t;

  // Flatten to the ordered screen sequence — module boundaries dissolve, per
  // the "no-repeat / quotas across module boundaries" rule.
  const flat: Array<{ moduleIndex: number; type: string; node: WidgetNode }> = [];
  modules.forEach((mod, mi) => {
    for (const s of mod.screens ?? [])
      flat.push({ moduleIndex: mi, type: s.type, node: s });
  });
  const types = flat.map((f) => f.type);
  const n = types.length;

  const score = flat.map((f, i) => {
    const cat = categoryOf(f.type);
    const mark = cat === "Interactive" ? "●" : "·";
    return `${String(i + 1).padStart(2)}  M${f.moduleIndex + 1}  ${mark} ${f.type.padEnd(20)} ${cat}`;
  });

  // --- structure: module + screen counts ---
  if (modules.length < 3 || modules.length > 7) {
    err("module-count", `story has ${modules.length} module(s) — expected 3–7`);
  }
  modules.forEach((mod, mi) => {
    const c = (mod.screens ?? []).length;
    if (c < 2 || c > 5) {
      err("module-length", `module ${mi + 1} has ${c} screen(s) — expected 2–5`);
    }
  });

  // --- repetition: never two consecutive screens of the same type ---
  for (let i = 1; i < types.length; i++) {
    if (types[i] === types[i - 1]) {
      err(
        "no-repeat",
        `screens ${i} and ${i + 1} are both "${types[i]}" — never two consecutive screens of the same type`,
      );
    }
  }

  // --- variety: at least 4 distinct widget groups ---
  const cats = new Set(types.map((t) => categoryOf(t)));
  if (n > 0 && cats.size < 4) {
    err(
      "variety",
      `only ${cats.size} widget group(s) used (${[...cats].join(", ")}) — expected at least 4`,
    );
  }

  // --- diagram density: at least one diagram widget ---
  if (n > 0 && !types.some((t) => DIAGRAM_TYPES.has(t))) {
    err(
      "diagram",
      "no diagram widget (mermaid-diagram / flow-diagram / infographic / data-chart) — add one when describing structure, process or comparison",
    );
  }

  // --- prose quota: prose + glossary-text under a third of screens ---
  const textCount = types.filter((t) => TEXT_TYPES.has(t)).length;
  if (n > 0 && textCount * 3 >= n) {
    err(
      "prose-quota",
      `prose + glossary-text is ${textCount}/${n} screens (≥ 1/3) — keep connective text under a third`,
    );
  }

  // --- retention: a quiz in the second half, before the CTA ---
  const secondHalf = types.slice(Math.ceil(n / 2));
  if (n > 0 && !secondHalf.includes("quiz")) {
    err(
      "quiz-second-half",
      "no quiz in the second half — readers should act before the CTA",
    );
  }

  // --- closer: end with a keepsake (advisory) ---
  if (n > 0 && !KEEPSAKE_TYPES.has(types[n - 1])) {
    warn(
      "keepsake",
      `story ends with "${types[n - 1]}" — a checklist or prompt-template is a stronger closer before the CTA`,
    );
  }

  // --- opener: a module must not open with a section-header repeating its own
  // title (module headers render themselves) — advisory. ---
  modules.forEach((mod, mi) => {
    const first = (mod.screens ?? [])[0];
    if (first?.type === "section-header" && typeof mod.title === "string") {
      const headline = first.props?.title;
      if (typeof headline === "string" && norm(headline) === norm(mod.title)) {
        warn(
          "module-opener",
          `module ${mi + 1} opens with a section-header repeating its title — module headers render themselves`,
        );
      }
    }
  });

  // --- cadence: no long stretch without a reader action (F6) ---
  // ponytail: 4 is a tunable heuristic, mirrored by the skill's payoff-cadence
  // rule. Interactive = the "Interactive" category.
  const MAX_STATIC_STREAK = 4;
  let streak = 0;
  let worstStreak = 0;
  for (const t of types) {
    if (categoryOf(t) === "Interactive") {
      streak = 0;
    } else {
      streak += 1;
      if (streak > worstStreak) worstStreak = streak;
    }
  }
  if (worstStreak > MAX_STATIC_STREAK) {
    warn(
      "cadence",
      `${worstStreak} static screens in a row (max ${MAX_STATIC_STREAK}) — energy sags without a reader action`,
    );
  }

  // --- repetition: same visual metaphor reused (F5) ---
  const tally = (values: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
    return m;
  };
  const layouts = flat
    .filter((f) => f.type === "infographic")
    .map((f) => (typeof f.node.props?.layout === "string" ? f.node.props.layout : ""));
  for (const [layout, c] of tally(layouts)) {
    if (c > 1) {
      warn("visual-metaphor", `infographic layout "${layout}" used ${c}× — vary the visual metaphor`);
    }
  }
  const mermaidKinds = flat
    .filter((f) => f.type === "mermaid-diagram")
    .map((f) => {
      const chart = typeof f.node.props?.chart === "string" ? f.node.props.chart.trim() : "";
      return chart.split(/[\s\n]/)[0] ?? "";
    });
  for (const [kind, c] of tally(mermaidKinds)) {
    if (c > 1) {
      warn("visual-metaphor", `mermaid "${kind}" diagram used ${c}× — vary the diagram type`);
    }
  }

  // --- audio-aware: a quote pinned to a minute but without a playable clip is
  // pending audio work. Only nagged when the document already carries audio
  // (the clips pipeline is clearly in play); without an `audio` block the
  // skill's handoff report owns the pending-clip list. ---
  if (doc.audio) {
    flat
      .filter((f) => f.type === "quote")
      .forEach((f) => {
        const p = (f.node.props ?? {}) as Record<string, unknown>;
        if (typeof p.timestamp === "string" && p.clip == null) {
          warn(
            "audio-pending",
            `module ${f.moduleIndex + 1}: quote at ${p.timestamp} has a minute chip but no clip — cut it with make-audio-clip or drop the timestamp`,
          );
        }
      });
  }

  // --- persistence collision: two widgets writing the same localStorage key
  // silently overwrite each other's saved state (the AI surface can emit dup
  // ids/storageKeys, and schema validation doesn't catch it). ---
  const allNodes: WidgetNode[] = [];
  const collect = (v: unknown) => {
    if (Array.isArray(v)) {
      for (const x of v) collect(x);
      return;
    }
    if (v && typeof v === "object") {
      if (typeof (v as { type?: unknown }).type === "string") {
        allNodes.push(v as WidgetNode);
      }
      for (const x of Object.values(v)) collect(x);
    }
  };
  collect(doc.story);
  const keyUses = new Map<string, number>();
  for (const node of allNodes) {
    const key = persistenceKeyOf(node);
    if (key) keyUses.set(key, (keyUses.get(key) ?? 0) + 1);
  }
  for (const [key, count] of keyUses) {
    if (count > 1) {
      err(
        "persistence-collision",
        `${count} widgets share the localStorage key "${key}" — they overwrite each other's saved state`,
      );
    }
  }

  const ok = !findings.some((f) => f.severity === "error");
  return { ok, findings, score };
}
