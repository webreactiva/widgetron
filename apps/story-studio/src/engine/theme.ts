/**
 * Theme compiler: a `design.md` with a token frontmatter becomes a widgetron
 * `[data-theme="<name>"]` CSS block (plus its dark variant). Changing brands =
 * changing one markdown file and regenerating. See src/themes/README.md for
 * the token contract (the ~40 custom properties widgets consume).
 *
 * The frontmatter is a small YAML subset parsed here on purpose (no dependency):
 * top-level `key: value` pairs plus one nested level under `tokens:` and `dark:`.
 */

export interface ThemeDesign {
  name: string;
  /**
   * Iconify collection for bare icon names under this theme (e.g.
   * "pixelarticons", "ph", "tabler"). Widgets receive it via
   * WidgetronProvider; it also lands in the CSS as `--wgt-icon-set` for
   * inspection. Omitted → the library default ("lucide").
   */
  iconSet?: string;
  /** Light tokens: css-var name (without `--`) → value. */
  tokens: Record<string, string>;
  /** Dark-mode overrides. */
  dark: Record<string, string>;
}

export interface CompiledTheme {
  name: string;
  iconSet?: string;
  css: string;
  /** Token names not in the known contract (possible typos). */
  warnings: string[];
}

/** The custom properties widgets actually consume (from styles/tokens.css). */
export const KNOWN_TOKENS = new Set([
  "background", "foreground", "card", "card-foreground", "popover",
  "popover-foreground", "primary", "primary-foreground", "secondary",
  "secondary-foreground", "muted", "muted-foreground", "accent",
  "accent-foreground", "destructive", "destructive-foreground", "border",
  "input", "ring", "success", "success-foreground", "warning",
  "warning-foreground", "info", "info-foreground",
  "wgt-callout-aha", "wgt-callout-info", "wgt-callout-warning",
  "wgt-tint-surface", "wgt-tint-border",
  "wgt-code-bg", "wgt-code-fg", "wgt-code-keyword", "wgt-code-string",
  "wgt-code-function", "wgt-code-comment", "wgt-code-property", "wgt-code-number",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "wgt-shadow-color", "wgt-shadow", "wgt-shadow-hover",
  "brand-1", "brand-2", "brand-3", "brand-4", "brand-5",
  "font-sans", "font-mono", "font-display", "radius",
]);

/**
 * Icon sets for themes that ship inside the widgetron library (no design.md
 * here to declare them). Themes compiled from a design.md declare their own
 * via the `iconSet:` frontmatter key.
 */
export const BUILT_IN_THEME_ICON_SETS: Record<string, string> = {
  webreactiva: "pixelarticons",
  podyscroll: "pixelarticons",
};

/** Parse the design.md frontmatter (--- fenced, YAML subset). */
export function parseDesign(markdown: string): ThemeDesign {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error("design.md: missing `---` frontmatter block");
  const lines = m[1].split(/\r?\n/);

  let name = "";
  let iconSet: string | undefined;
  const sections: Record<string, Record<string, string>> = { tokens: {}, dark: {} };
  let current: Record<string, string> | null = null;

  for (const raw of lines) {
    if (raw.trim() === "" || raw.trim().startsWith("#")) continue;
    const indented = /^\s/.test(raw);
    const idx = raw.indexOf(":");
    if (idx === -1) throw new Error(`design.md: cannot parse line "${raw}"`);
    const key = raw.slice(0, idx).trim();
    const value = stripQuotes(raw.slice(idx + 1).trim());

    if (!indented) {
      if (value === "") {
        if (!(key in sections)) {
          throw new Error(`design.md: unknown section "${key}" (expected tokens/dark)`);
        }
        current = sections[key];
      } else {
        current = null;
        if (key === "name") name = value;
        else if (key === "iconSet") iconSet = value;
        else throw new Error(`design.md: unknown top-level key "${key}"`);
      }
    } else {
      if (!current) throw new Error(`design.md: orphan indented line "${raw}"`);
      if (value === "") throw new Error(`design.md: empty value for "${key}"`);
      current[key] = value;
    }
  }

  if (!name) throw new Error("design.md: frontmatter needs a `name`");
  if (!/^[a-z0-9-]+$/.test(name)) {
    throw new Error(`design.md: theme name "${name}" must be kebab-case`);
  }
  if (iconSet !== undefined && !/^[a-z0-9-]+$/.test(iconSet)) {
    throw new Error(
      `design.md: iconSet "${iconSet}" must be a lowercase Iconify collection id`,
    );
  }
  return { name, iconSet, tokens: sections.tokens, dark: sections.dark };
}

/** Compile a parsed design into the [data-theme] CSS block(s). */
export function compileTheme(design: ThemeDesign): CompiledTheme {
  const { name, iconSet, tokens, dark } = design;
  if (Object.keys(tokens).length === 0) {
    throw new Error("design.md: `tokens:` section is empty");
  }
  const warnings = [...Object.keys(tokens), ...Object.keys(dark)]
    .filter((k) => !KNOWN_TOKENS.has(k))
    .map((k) => `unknown token "${k}" (not part of the widget contract — typo?)`);

  const block = (selector: string, vars: Record<string, string>) =>
    `${selector} {\n${Object.entries(vars)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join("\n")}\n}`;

  // The icon set is runtime config (WidgetronProvider), but it is also emitted
  // as a CSS custom property so a compiled theme is fully self-describing.
  const lightVars = iconSet
    ? { ...tokens, "wgt-icon-set": iconSet }
    : tokens;

  let css = `/* Generated from design.md — do not edit by hand. Regenerate with:\n   pnpm --filter @webreactiva/story-studio story theme <design.md> */\n`;
  css += block(`[data-theme="${name}"]`, lightVars);
  if (Object.keys(dark).length > 0) {
    css +=
      "\n\n" +
      block(`[data-theme="${name}"].dark,\n[data-theme="${name}"] .dark`, dark);
  }
  return { name, iconSet, css: css + "\n", warnings };
}

/** design.md text → compiled CSS (convenience). */
export function compileDesignMarkdown(markdown: string): CompiledTheme {
  return compileTheme(parseDesign(markdown));
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
