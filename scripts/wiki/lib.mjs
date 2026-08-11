// Shared helpers for the wiki toolchain (drift · coverage · lint). No dependencies.
//
// The contract these enforce lives in wiki/CONVENTIONS.md — this file must never
// become the place where the schema is defined by accident. When they disagree,
// CONVENTIONS.md wins and this file gets fixed.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";

/** The five page types. Mirrors wiki/CONVENTIONS.md § The five page types. */
export const TYPES = ["architecture", "flow", "entity", "concept", "decision"];

/** `confidence:` values. Absent means `high` — see CONVENTIONS § The one template. */
export const CONFIDENCE = ["high", "inferred"];

/**
 * Frontmatter keys every page must carry. Deliberately five: a page's date is
 * not one of them, because `synced:` already answers the question that matters
 * ("how old is this knowledge?") via `git show -s --format=%cs <sha>`.
 * Pages may carry any other key freely; the schema does not police them.
 */
export const REQUIRED_KEYS = ["title", "type", "responsibility", "sources", "synced"];

/**
 * Page count past which reading index.md first stops discriminating: too many
 * one-line summaries look plausible for the same question. A conservative
 * marker anchored to the pattern's own "~hundreds of pages", not a measured
 * threshold — its job is to bring the retrieval decision back to a human
 * instead of letting it be forgotten.
 */
export const INDEX_SCALE_LIMIT = 80;

/** Files inside wiki/ that are not pages (no frontmatter contract). */
export const NON_PAGES = new Set(["CONVENTIONS.md", "index.md", "log.md"]);

/** A `sources:` entry claiming a whole workspace root documents nothing in particular. */
const WORKSPACE_ROOT_RE = /^(?:apps|packages)\/[^/*?]+\/?$/;

export function repoRoot() {
  return git(["rev-parse", "--show-toplevel"]).trim();
}

export function git(args, opts = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...opts,
  });
}

export function gitOrNull(args) {
  try {
    return git(args, { stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

export function commitExists(sha) {
  return gitOrNull(["cat-file", "-e", `${sha}^{commit}`]) !== null;
}

const lines = (s) =>
  (s ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * Files changed between `sha` and the **working tree**, new files included.
 * Uncommitted work counts: a page is stale the moment its source is edited,
 * not only once it is committed.
 */
export function changedSince(sha) {
  const tracked = gitOrNull(["diff", "--name-only", sha, "--"]);
  const untracked = gitOrNull(["ls-files", "--others", "--exclude-standard"]);
  return [...new Set([...lines(tracked), ...lines(untracked)])].sort();
}

/** Files changed by the commits between `sha` and HEAD. Committed history only. */
export function changedInCommits(sha) {
  return lines(gitOrNull(["diff", "--name-only", `${sha}..HEAD`, "--"])).sort();
}

export function commitsSince(sha) {
  const out = gitOrNull(["rev-list", "--count", `${sha}..HEAD`]);
  return out ? Number(out.trim()) : 0;
}

export function shortSha(sha) {
  return (sha ?? "").slice(0, 7);
}

/** Every tracked file in the repo. */
export function trackedFiles() {
  return lines(gitOrNull(["ls-files"]));
}

/** Tracked files minus wiki/.wikiignore — what coverage is measured against. */
export function indexableFiles(wikiDir) {
  const excludes = readWikiIgnore(wikiDir).map((p) => `:(exclude)${p}`);
  return lines(gitOrNull(["ls-files", "--", ".", ...excludes]));
}

export function readWikiIgnore(wikiDir) {
  const file = join(wikiDir, ".wikiignore");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/** The repo-level checkpoint: { version, last_indexed_commit }. */
export function readState(wikiDir) {
  const file = join(wikiDir, ".state.json");
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

/** Every page under wiki/, excluding the non-page files. `id` is the path sans .md. */
export function listPages(wikiDir) {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) {
        const rel = relative(wikiDir, full).split(sep).join(posix.sep);
        if (NON_PAGES.has(rel)) continue;
        out.push({ id: rel.replace(/\.md$/, ""), rel, path: full });
      }
    }
  };
  walk(wikiDir);
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Flat frontmatter: scalars, block lists (`- item`) and inline arrays (`[a, b]`).
 * Deliberately limited — it is the contract documented in CONVENTIONS.md, and a
 * parser that accepts more than the contract lets pages drift out of it.
 */
export function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { data: null, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: null, body: raw };
  const block = raw.slice(raw.indexOf("\n") + 1, end);
  const body = raw.slice(end + 4);
  const data = {};
  let currentKey = null;
  for (const line of block.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && currentKey) {
      data[currentKey].push(unquote(item[1]));
      continue;
    }
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!pair) continue;
    const [, key, rest] = pair;
    if (rest === "") {
      currentKey = key;
      data[key] = [];
    } else if (rest.startsWith("[")) {
      currentKey = null;
      data[key] = rest
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((v) => unquote(v.trim()))
        .filter(Boolean);
    } else {
      currentKey = null;
      data[key] = unquote(rest);
    }
  }
  return { data, body };
}

function unquote(value) {
  return value.replace(/^["']|["']$/g, "").trim();
}

export function readPage(page) {
  const raw = readFileSync(page.path, "utf8");
  const { data, body } = parseFrontmatter(raw);
  return { ...page, meta: data, body, raw };
}

/** A wildcard-free source pointing at a directory means `dir/**`. */
export function normalizeSource(source, root) {
  if (/[*?]/.test(source)) return source;
  const full = join(root, source);
  if (existsSync(full) && statSync(full).isDirectory())
    return `${source.replace(/\/$/, "")}/**`;
  return source;
}

/** Does this `sources:` entry claim an entire app/package? (coverage false green) */
export function isWorkspaceRoot(source) {
  return WORKSPACE_ROOT_RE.test(source);
}

export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") {
          i++;
          re += "(?:[^/]*/)*";
        } else {
          re += ".*";
        }
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(file, patterns) {
  return patterns.some((p) => p.test(file));
}

/** Compiled matchers for one page's `sources:`. */
export function sourcePatterns(meta, root) {
  return [].concat(meta?.sources ?? []).map((s) => globToRegExp(normalizeSource(s, root)));
}

/**
 * Markdown links out of a page body, code fences and spans stripped first.
 * Returns `{ raw, target, kind }` where kind is:
 *   "page"     → resolves inside wiki/ (compare against page ids / non-pages)
 *   "repo"     → resolves outside wiki/ (compare against the filesystem)
 *   "external" → http(s), mailto, bare anchors — never checked
 * The wiki links with plain markdown on purpose: wikilink syntax (`[[term]]`)
 * tends to collide with whatever the host project already uses it for — in this
 * repo, RichText glossary terms.
 */
export function markdownLinks(body, pageRel, wikiDir, root) {
  const prose = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const out = [];
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const raw = m[1];
    if (/^(?:https?:|mailto:|#)/.test(raw)) {
      out.push({ raw, target: null, kind: "external" });
      continue;
    }
    out.push(classifyLink(raw, pageRel, wikiDir, root));
  }
  return out;
}

/** `related:` entries are declared links and get checked exactly like body links. */
export function relatedLinks(meta, pageRel, wikiDir, root) {
  return [].concat(meta?.related ?? [])
    .filter((r) => r.endsWith(".md"))
    .map((r) => classifyLink(r, pageRel, wikiDir, root));
}

function classifyLink(raw, pageRel, wikiDir, root) {
  const clean = raw.split("#")[0];
  if (!clean) return { raw, target: null, kind: "external" };
  const from = dirname(join(wikiDir, pageRel));
  const abs = resolve(from, clean);
  const inWiki = relative(wikiDir, abs);
  if (!inWiki.startsWith("..") && !inWiki.startsWith(sep)) {
    return { raw, target: inWiki.split(sep).join(posix.sep), kind: "page" };
  }
  return {
    raw,
    target: relative(root, abs).split(sep).join(posix.sep),
    kind: "repo",
  };
}

const tty = process.stdout.isTTY;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const color = {
  dim: paint(2),
  red: paint(31),
  yellow: paint(33),
  green: paint(32),
  bold: paint(1),
};
