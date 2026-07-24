#!/usr/bin/env node
// The wiki health CLI. Three deterministic checks, one entry point.
//
//   node scripts/wiki/wiki.mjs            all three, human report
//   node scripts/wiki/wiki.mjs drift      staleness — repo checkpoint + per page
//   node scripts/wiki/wiki.mjs coverage   code no page's `sources:` claims
//   node scripts/wiki/wiki.mjs lint       frontmatter, links, orphans, dead sources
//
//   --json      machine-readable, for the /wiki-* skills
//   --strict    exit 1 on any finding at all (CI)
//   -v          list every file instead of a summary
//
// Exit code: 1 on lint errors (a broken wiki), or on anything with --strict.
// Staleness and coverage are debt, not breakage — they do not fail a plain run.
import { join } from "node:path";

import * as coverage from "./coverage.mjs";
import * as drift from "./drift.mjs";
import { color, repoRoot } from "./lib.mjs";
import * as lint from "./lint.mjs";

const COMMANDS = { drift, coverage, lint };

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("-")));
const command = argv.find((a) => !a.startsWith("-")) ?? "all";
const asJson = flags.has("--json");
const strict = flags.has("--strict");
const verbose = flags.has("-v") || flags.has("--verbose");

if (command !== "all" && !COMMANDS[command]) {
  console.error(`unknown command: ${command} (expected: ${Object.keys(COMMANDS).join(", ")}, all)`);
  process.exit(2);
}

const root = repoRoot();
const wikiDir = join(root, "wiki");
const ctx = { root, wikiDir, verbose };

const names = command === "all" ? Object.keys(COMMANDS) : [command];
const results = Object.fromEntries(names.map((n) => [n, COMMANDS[n].run(ctx)]));

if (asJson) {
  console.log(JSON.stringify(command === "all" ? results : results[command], null, 2));
} else {
  let printed = 0;
  for (const name of names) printed += COMMANDS[name].report(results[name], { verbose });
  if (command === "all" && !printed)
    console.log(color.green(`✓ wiki: current, covered and sound (${results.lint.pages} pages)`));
}

const errors = results.lint?.errors.length ?? 0;
const anything =
  errors +
  (results.lint?.warnings.length ?? 0) +
  (results.drift ? results.drift.stale.length + results.drift.skipped.length : 0) +
  (results.drift?.repo.status === "behind" ? 1 : 0) +
  (results.coverage?.unclaimed.length ?? 0);

process.exit(strict ? (anything ? 1 : 0) : errors ? 1 : 0);
