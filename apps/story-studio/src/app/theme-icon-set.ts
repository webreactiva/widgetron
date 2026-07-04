import { BUILT_IN_THEME_ICON_SETS, parseDesign } from "../engine/theme";

/**
 * theme name → Iconify collection, resolved from the design.md frontmatters
 * bundled with the app (browser-safe: Vite inlines them as raw strings) plus
 * the library's built-in themes. `story render` resolves the same thing in
 * node (render/build.ts) — one contract, two runtimes.
 */
const designs = import.meta.glob("../themes/*.design.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const fromDesigns: Record<string, string> = {};
for (const raw of Object.values(designs)) {
  try {
    const design = parseDesign(raw);
    if (design.iconSet) fromDesigns[design.name] = design.iconSet;
  } catch {
    // Invalid design.md — the CLI (`story theme`) is the place that reports it.
  }
}

export function themeIconSet(theme?: string): string | undefined {
  if (!theme) return undefined;
  return fromDesigns[theme] ?? BUILT_IN_THEME_ICON_SETS[theme];
}
