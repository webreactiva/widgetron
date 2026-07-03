import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import { validateEnvelope } from "./engine/core";

/**
 * Story Studio local authoring API (decision D-003): the WRITE path lives in
 * the Vite DEV server only. Source of truth stays `content/*.story.json` in
 * the repo — saving in the editor mutates the file on disk, so review is a
 * plain git diff. `vite build` output and exported guides carry no write
 * surface at all, which is why there is no editKey/auth in this stage.
 *
 * Endpoints (dev only):
 *   GET  /api/stories          → catalog index (meta of every document)
 *   GET  /api/stories/:slug    → one raw document
 *   PUT  /api/stories/:slug    → validate envelope + write pretty JSON
 *   POST /api/export/:slug     → run the same pipeline as `story render`
 *
 * Note: PUT validates the ENVELOPE here (node-safe); the editor also runs the
 * full widget-tree validation in the browser before saving. The single source
 * of generation is src/render/build.ts, shared with the CLI.
 */
export function storyStudioApi(): Plugin {
  const appRoot = fileURLToPath(new URL("..", import.meta.url));
  const contentDir = path.join(appRoot, "content");

  return {
    name: "story-studio:api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api", (req, res, next) => {
        handle(req, res, contentDir, appRoot).catch((error) => {
          send(res, 500, { error: String(error instanceof Error ? error.message : error) });
        });
        void next;
      });
    },
  };
}

async function handle(
  req: IncomingMessage,
  res: ServerResponse,
  contentDir: string,
  appRoot: string,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://localhost");
  const [, resource, slug] = url.pathname.split("/"); // "/stories/:slug" (base /api stripped)

  if (resource === "stories" && !slug && req.method === "GET") {
    return send(res, 200, listStories(contentDir));
  }

  if (resource === "stories" && slug) {
    const file = storyFile(contentDir, slug);
    if (!file) return send(res, 400, { error: "Invalid slug" });

    if (req.method === "GET") {
      if (!fs.existsSync(file)) return send(res, 404, { error: "Not found" });
      res.setHeader("Content-Type", "application/json");
      res.end(fs.readFileSync(file, "utf8"));
      return;
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        return send(res, 400, { error: "Body is not valid JSON" });
      }
      const result = validateEnvelope(parsed);
      if (!result.valid || !result.document) {
        return send(res, 422, { error: "Invalid document", errors: result.errors });
      }
      if (result.document.meta.slug !== slug) {
        return send(res, 422, {
          error: `meta.slug ("${result.document.meta.slug}") must match the file slug ("${slug}")`,
        });
      }
      fs.mkdirSync(contentDir, { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
      return send(res, 200, { ok: true, file: path.relative(appRoot, file) });
    }
  }

  if (resource === "export" && slug && req.method === "POST") {
    const file = storyFile(contentDir, slug);
    if (!file) return send(res, 400, { error: "Invalid slug" });
    if (!fs.existsSync(file)) return send(res, 404, { error: "Not found" });
    // Same generation path as the CLI (`story render`).
    const { renderStory } = await import("./render/build");
    const outDir = await renderStory(slug, { appRoot });
    return send(res, 200, { ok: true, outDir: path.relative(appRoot, outDir) });
  }

  send(res, 404, { error: "Unknown API route" });
}

function listStories(contentDir: string) {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".story.json"))
    .sort()
    .map((f) => {
      const slug = f.replace(/\.story\.json$/, "");
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(contentDir, f), "utf8"));
        return { slug, meta: doc?.meta ?? {}, error: null };
      } catch (error) {
        return { slug, meta: {}, error: String(error) };
      }
    });
}

function storyFile(contentDir: string, slug: string): string | null {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  return path.join(contentDir, `${slug}.story.json`);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body, null, 2));
}
