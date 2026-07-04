import * as fs from "node:fs";
import { createRequire } from "node:module";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { validateEnvelope, resolveStory, type StoryDocument } from "../engine/core";
import { BUILT_IN_THEME_ICON_SETS, parseDesign } from "../engine/theme";

/**
 * `story render <slug>`: content/<slug>.story.json → dist/<slug>/, a
 * self-contained FOLDER (index.html + hydration bundle + theme CSS, relative
 * base) ready to upload to any host. MVP strategy per the plan: static shell
 * (title + module index in the HTML itself) + client hydration; full
 * `renderToString` prerender and single-file inlining stay deferred (D-002).
 *
 * The story tree is resolved (surprises + CTA injected — D-004) BEFORE being
 * embedded, so the published client never computes placement.
 *
 * This module is node-safe (no widgetron imports): the generated entry is the
 * one importing @webreactiva/widgetron, compiled by the inner Vite build.
 */
export interface RenderOptions {
  /** apps/story-studio root. Defaults to this package. */
  appRoot?: string;
}

export async function renderStory(
  slug: string,
  { appRoot }: RenderOptions = {},
): Promise<string> {
  const root = appRoot ?? fileURLToPath(new URL("../..", import.meta.url));
  const file = path.join(root, "content", `${slug}.story.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`No document at ${path.relative(root, file)}`);
  }

  const envelope = validateEnvelope(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!envelope.valid || !envelope.document) {
    throw new Error(`Invalid document:\n- ${envelope.errors.join("\n- ")}`);
  }
  const doc = envelope.document;
  const resolved = resolveStory(doc);

  // Resolve widgetron through its package `exports`, never through the
  // monorepo layout: the workspace resolves to src/index.ts, an installed
  // package to dist/index.js. Both carry the Tailwind classes @source needs.
  // (createRequire, not import.meta.resolve: the latter is unavailable under
  // Vitest's SSR transform.)
  const widgetronEntry = resolvePackagePath("@webreactiva/widgetron");
  const widgetronDir = path.dirname(widgetronEntry);
  const widgetronIsSource = widgetronEntry.endsWith(".ts");
  const renderDir = path.join(root, ".render", slug);
  const outDir = path.join(root, "dist", slug);
  fs.rmSync(renderDir, { recursive: true, force: true });
  fs.mkdirSync(renderDir, { recursive: true });

  fs.writeFileSync(
    path.join(renderDir, "document.json"),
    JSON.stringify({ meta: doc.meta, audio: doc.audio ?? null, story: resolved }, null, 2),
  );
  fs.writeFileSync(path.join(renderDir, "index.html"), htmlShell(doc));
  fs.writeFileSync(
    path.join(renderDir, "main.tsx"),
    mainTsx(resolveThemeIconSet(doc.meta.theme, root)),
  );
  fs.writeFileSync(path.join(renderDir, "styles.css"), stylesCss(doc, root, widgetronDir));

  await build({
    configFile: false,
    logLevel: "warn",
    root: renderDir,
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        // Pin the package to the entry node resolved, so the inner build
        // works no matter where renderDir sits relative to node_modules.
        { find: /^@webreactiva\/widgetron$/, replacement: widgetronEntry },
        // The library's internal `@/` alias only exists in its TS source;
        // the built dist is already self-contained.
        ...(widgetronIsSource
          ? [{ find: /^@\//, replacement: `${widgetronDir}/` }]
          : []),
      ],
    },
    build: { outDir, emptyOutDir: true },
  });

  fs.rmSync(renderDir, { recursive: true, force: true });
  return outDir;
}

/** Static shell: real metadata + a readable module index before hydration. */
function htmlShell(doc: StoryDocument): string {
  const { meta } = doc;
  const modules = (doc.story.props?.modules ?? []) as Array<{
    title?: string;
    subtitle?: string;
  }>;
  const summary = modules
    .map(
      (m) =>
        `        <li>${escapeHtml(String(m.title ?? ""))}${
          m.subtitle ? ` — ${escapeHtml(String(m.subtitle))}` : ""
        }</li>`,
    )
    .join("\n");
  const description = meta.description ?? `Interactive guide: ${meta.title}`;

  return `<!doctype html>
<html lang="${escapeHtml(meta.lang ?? "en")}"${meta.theme ? ` data-theme="${escapeHtml(meta.theme)}"` : ""}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <script type="module" src="./main.tsx"></script>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root">
      <main style="max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; font-family: system-ui, sans-serif;">
        <h1>${escapeHtml(meta.title)}</h1>
        <p>${escapeHtml(description)}</p>
        <ol>
${summary}
        </ol>
      </main>
    </div>
  </body>
</html>
`;
}

/**
 * theme name → Iconify collection, resolved at build time: the theme's
 * design.md frontmatter (`iconSet:`) wins, then the library's built-in map.
 * Mirrors the app-side resolver (src/app/theme-icon-set.ts) in node.
 */
function resolveThemeIconSet(
  theme: string | undefined,
  appRoot: string,
): string | undefined {
  if (!theme) return undefined;
  const designPath = path.join(appRoot, "src", "themes", `${theme}.design.md`);
  if (fs.existsSync(designPath)) {
    try {
      const design = parseDesign(fs.readFileSync(designPath, "utf8"));
      if (design.iconSet) return design.iconSet;
    } catch {
      // Invalid design.md — `story theme` is the command that reports it.
    }
  }
  return BUILT_IN_THEME_ICON_SETS[theme];
}

/** The hydration entry (compiled by the inner Vite build). */
const mainTsx = (iconSet: string | undefined) => `import { createRoot } from "react-dom/client";
import { WidgetronProvider, renderWidget, esLabels } from "@webreactiva/widgetron";
import doc from "./document.json";
import "./styles.css";

const lang: string | undefined = doc.meta.lang ?? undefined;
const isSpanish = typeof lang === "string" && lang.startsWith("es");
const story = {
  ...doc.story,
  props: {
    ...(doc.story.props ?? {}),
    // Full-page reading experience (the widget defaults to h-[600px]).
    className: "h-dvh rounded-none border-0",
  },
};

createRoot(document.getElementById("root")!).render(
  <WidgetronProvider
    locale={lang}
    labels={isSpanish ? esLabels : undefined}
    iconSet={${JSON.stringify(iconSet)}}
  >
    {renderWidget(story)}
  </WidgetronProvider>,
);
`;

/** Tailwind bridge + widgetron theme layer + optional compiled brand theme. */
function stylesCss(doc: StoryDocument, appRoot: string, widgetronDir: string): string {
  const themeCss = resolvePackagePath(
    "@webreactiva/widgetron/styles/theme.css",
  );
  let css = `@import "tailwindcss";
@import "${themeCss.replaceAll("\\", "/")}";
@source "${widgetronDir.replaceAll("\\", "/")}";

html, body, #root { margin: 0; background: var(--background); color: var(--foreground); }
`;
  const theme = doc.meta.theme;
  if (theme && theme !== "webreactiva") {
    const themeCss = path.join(appRoot, "src", "themes", `${theme}.css`);
    if (fs.existsSync(themeCss)) {
      css += `\n/* --- theme "${theme}" (compiled from design.md) --- */\n`;
      css += fs.readFileSync(themeCss, "utf8");
    }
  }
  return css;
}

/** Node-resolve a specifier through package `exports`, from this module. */
function resolvePackagePath(specifier: string): string {
  return createRequire(import.meta.url).resolve(specifier);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
