// Generate `registry.json` from the widget source — the shadcn distribution
// registry, derived from code so it never drifts (same spirit as the enriched
// manifest in packages/widgets/src/lib/registry.tsx).
//
// Run:   node build-registry.mjs
// Then:  shadcn build registry.json --output public/r   (emits self-contained
//        public/r/<name>.json for `npx shadcn add <url>` — needs network).
//
// Schemas: https://ui.shadcn.com/schema/registry.json + registry-item.json

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url)); // packages/registry
const SRC = join(HERE, "..", "widgets", "src");
const HOMEPAGE = "https://widgetron.dev";

/** URL of another item in *this* registry (shadcn resolves internal deps by URL). */
const R = (name) => `${HOMEPAGE}/r/${name}.json`;

/** Path a shadcn `files[].path` uses — relative to this registry.json. */
const rel = (fromSrc) => relative(HERE, join(SRC, fromSrc));

/** `@/…` import specifier → the registry item that ships it. */
const INTERNAL = {
  "@/lib/utils": "widgetron-utils",
  "@/lib/i18n": "widgetron-i18n",
  "@/lib/icons": "widgetron-icons",
  "@/lib/formula": "widgetron-formula",
  "@/primitives/button": "widgetron-button",
  "@/primitives/icon": "widgetron-icon",
  "@/primitives/tooltip": "widgetron-tooltip",
};

/** Extract every import/dynamic-import specifier from a source file. */
function imports(absPath) {
  const src = readFileSync(absPath, "utf8");
  const re = /(?:\bfrom|\bimport\s*\()\s*["']([^"']+)["']/g;
  const out = new Set();
  let m;
  while ((m = re.exec(src))) out.add(m[1]);
  return [...out];
}

/** Bare npm package name from a specifier (keep the scope for @scoped/pkg). */
function pkgName(spec) {
  return spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
}

/**
 * Classify a module's imports into npm `dependencies` + registry deps (URLs).
 * `self` is the item's own name so self-references are dropped.
 */
function classify(files, self) {
  const dependencies = new Set();
  const registry = new Set();
  for (const f of files) {
    for (const spec of imports(join(SRC, f))) {
      if (spec === "react" || spec.startsWith("react/") || spec === "react-dom" || spec.startsWith("react-dom/")) {
        continue; // peer dependency, assumed present
      }
      if (spec.startsWith("@/widgets/")) {
        const name = spec.split("/")[2];
        if (name !== self) registry.add(R(name));
      } else if (INTERNAL[spec]) {
        if (INTERNAL[spec] !== self) registry.add(R(INTERNAL[spec]));
      } else if (spec.startsWith("@/")) {
        console.warn(`  ! unmapped internal import "${spec}" in ${f}`);
      } else if (spec.startsWith(".")) {
        continue; // sibling file, shipped in the same item
      } else {
        dependencies.add(pkgName(spec));
      }
    }
  }
  return { dependencies: [...dependencies].sort(), registry: [...registry].sort() };
}

/** "spot-the-bug" → "Spot the Bug". */
const titleCase = (s) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Best-effort pull of `summary` / `category` string literals from a meta file. */
function meta(absPath) {
  let src = "";
  try {
    src = readFileSync(absPath, "utf8");
  } catch {
    return {};
  }
  const summary = src.match(/summary:\s*"([^"]+)"/)?.[1];
  const category = src.match(/category:\s*"([^"]+)"/)?.[1];
  return { summary, category };
}

/** Assemble one registry item, sorting keys for a stable, readable diff. */
function item({ name, type, title, description, categories, files, extraRegistry = [] }) {
  const { dependencies, registry } = classify(
    files.map((f) => f.path),
    name,
  );
  const registryDependencies = [...new Set([...registry, ...extraRegistry])].sort();
  const out = { name, type, title, description };
  if (categories?.length) out.categories = categories;
  if (dependencies.length) out.dependencies = dependencies;
  if (registryDependencies.length) out.registryDependencies = registryDependencies;
  out.files = files.map((f) => ({ path: rel(f.path), type: f.type, ...(f.target ? { target: f.target } : {}) }));
  return out;
}

// ── Foundation: design tokens (every widget renders against these) ──────────
const TOKENS = R("widgetron-tokens");
const items = [
  {
    name: "widgetron-tokens",
    type: "registry:file",
    title: "Widgetron design tokens",
    description:
      "Aseptic semantic design tokens, the Tailwind v4 @theme bridge, animations, and the opt-in [data-theme=webreactiva] brand overrides. Install once; every widget renders against these.",
    files: [
      { path: rel("styles/tokens.css"), type: "registry:file", target: "styles/widgetron-tokens.css" },
      { path: rel("styles/theme.css"), type: "registry:file", target: "styles/widgetron-theme.css" },
    ],
  },
];

// ── Shared libs ─────────────────────────────────────────────────────────────
const LIBS = [
  ["widgetron-utils", "lib/utils.ts", "cn() utility", "clsx + tailwind-merge className helper used by every widget."],
  ["widgetron-i18n", "lib/i18n.tsx", "i18n provider", "WidgetronProvider + useLabels/useLocale — customizable, translatable widget copy."],
  ["widgetron-icons", "lib/icons.tsx", "Control icons", "Inline, dependency-free control SVGs (play, chevrons, check…)."],
  ["widgetron-formula", "lib/formula.ts", "Formula eval", "Safe expression evaluation + number formatting for tangle-text / scrubber."],
];
for (const [name, path, title, description] of LIBS) {
  items.push(item({ name, type: "registry:lib", title, description, files: [{ path, type: "registry:lib" }] }));
}

// ── Primitives (shadcn-compatible UI building blocks) ───────────────────────
const PRIMITIVES = [
  ["widgetron-button", "primitives/button.tsx", "Button", "cva Button with Radix Slot/asChild support."],
  ["widgetron-icon", "primitives/icon.tsx", "Icon", "Universal Iconify icon; bare names resolve against the theme's icon set."],
  ["widgetron-tooltip", "primitives/tooltip.tsx", "Tooltip", "Lightweight tooltip primitive used by the glossary."],
];
for (const [name, path, title, description] of PRIMITIVES) {
  items.push(item({ name, type: "registry:ui", title, description, files: [{ path, type: "registry:ui" }], extraRegistry: [TOKENS] }));
}

// ── Widgets (one item per widget folder) ────────────────────────────────────
const WIDGETS_DIR = join(SRC, "widgets");
const widgetNames = readdirSync(WIDGETS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const name of widgetNames) {
  const dir = join(WIDGETS_DIR, name);
  const shipped = readdirSync(dir)
    .filter((f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && f !== "index.ts" && !f.endsWith(".meta.ts"))
    .sort();
  if (!shipped.length) {
    console.warn(`  ! ${name}: no shippable component file, skipping`);
    continue;
  }
  // Prefer <name>.meta.ts for copy; fall back to the first *.meta.ts present.
  const metaFile =
    readdirSync(dir).find((f) => f === `${name}.meta.ts`) ||
    readdirSync(dir).find((f) => f.endsWith(".meta.ts"));
  const { summary, category } = metaFile ? meta(join(dir, metaFile)) : {};
  items.push(
    item({
      name,
      type: "registry:component",
      title: titleCase(name),
      description: summary || `The ${titleCase(name)} learning widget.`,
      categories: ["education", ...(category ? [category.toLowerCase()] : [])],
      files: shipped.map((f) => ({ path: `widgets/${name}/${f}`, type: "registry:component" })),
      extraRegistry: [TOKENS],
    }),
  );
}

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "widgetron",
  homepage: HOMEPAGE,
  items,
};

writeFileSync(join(HERE, "registry.json"), JSON.stringify(registry, null, 2) + "\n");
console.log(`registry.json — ${items.length} items (${widgetNames.length} widgets + ${items.length - widgetNames.length} shared).`);
