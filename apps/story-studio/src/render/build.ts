import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { validateEnvelope, resolveStory, type StoryDocument } from "../engine/core";

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

  const widgetsSrc = path.resolve(root, "../../packages/widgets/src");
  const renderDir = path.join(root, ".render", slug);
  const outDir = path.join(root, "dist", slug);
  fs.rmSync(renderDir, { recursive: true, force: true });
  fs.mkdirSync(renderDir, { recursive: true });

  fs.writeFileSync(
    path.join(renderDir, "document.json"),
    JSON.stringify({ meta: doc.meta, audio: doc.audio ?? null, story: resolved }, null, 2),
  );
  fs.writeFileSync(path.join(renderDir, "index.html"), htmlShell(doc));
  fs.writeFileSync(path.join(renderDir, "main.tsx"), MAIN_TSX);
  fs.writeFileSync(path.join(renderDir, "styles.css"), stylesCss(doc, root, widgetsSrc));

  await build({
    configFile: false,
    logLevel: "warn",
    root: renderDir,
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [{ find: /^@\//, replacement: `${widgetsSrc}/` }],
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

/** The hydration entry (compiled by the inner Vite build). */
const MAIN_TSX = `import { createRoot } from "react-dom/client";
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
    iconSet={doc.meta.theme === "webreactiva" ? "pixelarticons" : undefined}
  >
    {renderWidget(story)}
  </WidgetronProvider>,
);
`;

/** Tailwind bridge + widgetron theme layer + optional compiled brand theme. */
function stylesCss(doc: StoryDocument, appRoot: string, widgetsSrc: string): string {
  let css = `@import "tailwindcss";
@import "${widgetsSrc.replaceAll("\\", "/")}/styles/theme.css";
@source "${widgetsSrc.replaceAll("\\", "/")}";

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

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
