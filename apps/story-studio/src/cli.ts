import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Story Studio CLI — the same engine the app and the dev API use.
 *
 *   pnpm --filter @webreactiva/story-studio story validate <slug|path>
 *   pnpm --filter @webreactiva/story-studio story lint <slug|path> [--score]
 *   pnpm --filter @webreactiva/story-studio story render <slug>
 *       [--swetrix <projectId>] [--dark] [--text-scale <ratio>]
 *   pnpm --filter @webreactiva/story-studio story theme <design.md> [outDir]
 *   pnpm --filter @webreactiva/story-studio story manifest [outFile]
 */
const appRoot = fileURLToPath(new URL("..", import.meta.url));
const [command, target, extra] = process.argv.slice(2);

async function main(): Promise<void> {
  switch (command) {
    case "validate": {
      if (!target) usage("validate <slug|path/to/file.story.json>");
      const file = target.endsWith(".json")
        ? path.resolve(target)
        : path.join(appRoot, "content", `${target}.story.json`);
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      // Full validation (envelope + resolved widget tree) — tsx compiles the
      // library's TSX, so the registry is available here.
      const { validateStoryDocument } = await import("./engine/validate");
      const result = validateStoryDocument(raw);
      if (result.valid) {
        console.log(`✔ ${path.basename(file)} is valid`);
        return;
      }
      console.error(`✘ ${path.basename(file)} has ${result.errors.length} error(s):`);
      for (const error of result.errors) console.error(`  - ${error}`);
      process.exitCode = 1;
      return;
    }

    case "lint": {
      if (!target) usage("lint <slug|path/to/file.story.json> [--score]");
      const file = target.endsWith(".json")
        ? path.resolve(target)
        : path.join(appRoot, "content", `${target}.story.json`);
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const { lintStoryDocument } = await import("./engine/lint");
      const result = lintStoryDocument(raw);
      const name = path.basename(file);

      if (extra === "--score") {
        console.log(`Partitura · ${name}`);
        for (const line of result.score) console.log(`  ${line}`);
        console.log("");
      }

      const errors = result.findings.filter((f) => f.severity === "error");
      const warnings = result.findings.filter((f) => f.severity === "warning");
      for (const f of warnings) console.warn(`  ⚠ [${f.rule}] ${f.message}`);
      for (const f of errors) console.error(`  ✘ [${f.rule}] ${f.message}`);

      if (result.ok) {
        console.log(
          `✔ ${name} passes pacing lint${warnings.length ? ` (${warnings.length} warning(s))` : ""}`,
        );
        return;
      }
      console.error(`✘ ${name} — ${errors.length} pacing error(s)`);
      process.exitCode = 1;
      return;
    }

    case "render": {
      if (!target) usage("render <slug>");
      // Validate fully before building.
      const file = path.join(appRoot, "content", `${target}.story.json`);
      const raw = JSON.parse(fs.readFileSync(file, "utf8"));
      const { validateStoryDocument } = await import("./engine/validate");
      const result = validateStoryDocument(raw);
      if (!result.valid) {
        console.error(`✘ Not rendering — ${result.errors.length} error(s):`);
        for (const error of result.errors) console.error(`  - ${error}`);
        process.exitCode = 1;
        return;
      }
      const { renderStory } = await import("./render/build");
      // `--swetrix <id>` wins over the SWETRIX_PROJECT_ID env var; when neither
      // is set the dist stays vendor-free (no analytics injected).
      const swetrixProjectId =
        flagValue("--swetrix") ?? process.env.SWETRIX_PROJECT_ID ?? undefined;
      const dark = hasFlag("--dark");
      const textScaleRaw = flagValue("--text-scale");
      const desktopTextScale = textScaleRaw ? Number(textScaleRaw) : undefined;
      if (textScaleRaw && !(desktopTextScale! > 1)) {
        usage("render <slug> [--text-scale <ratio>] — ratio must be a number > 1");
      }
      const outDir = await renderStory(target, {
        appRoot,
        swetrixProjectId,
        dark,
        desktopTextScale,
      });
      if (swetrixProjectId) {
        console.log(`  ↳ Swetrix analytics wired (project ${swetrixProjectId})`);
      }
      if (dark) console.log("  ↳ Dark theme forced");
      if (desktopTextScale)
        console.log(`  ↳ Desktop text scaled ×${desktopTextScale}`);
      console.log(`✔ Rendered → ${path.relative(process.cwd(), outDir)}`);
      return;
    }

    case "theme": {
      if (!target) usage("theme <design.md> [outDir]");
      const { compileDesignMarkdown } = await import("./engine/core");
      const compiled = compileDesignMarkdown(fs.readFileSync(path.resolve(target), "utf8"));
      for (const warning of compiled.warnings) console.warn(`⚠ ${warning}`);
      const outDir = extra ? path.resolve(extra) : path.join(appRoot, "src", "themes");
      fs.mkdirSync(outDir, { recursive: true });
      const outFile = path.join(outDir, `${compiled.name}.css`);
      fs.writeFileSync(outFile, compiled.css);
      console.log(`✔ Theme "${compiled.name}" → ${path.relative(process.cwd(), outFile)}`);
      return;
    }

    case "manifest": {
      // The AI-generation contract: every widget type with whenToUse, JSON
      // Schema and a valid example (what /podcast-to-story feeds the agent).
      const { getWidgetManifestJSON } = await import("@webreactiva/widgetron");
      const json = JSON.stringify(getWidgetManifestJSON(), null, 2);
      if (target) {
        fs.writeFileSync(path.resolve(target), `${json}\n`);
        console.log(`✔ Manifest → ${target}`);
      } else {
        console.log(json);
      }
      return;
    }

    default:
      usage("validate|lint|render|theme|manifest …");
  }
}

function usage(hint: string): never {
  console.error(`Usage: story ${hint}`);
  process.exit(1);
}

/** Read a `--flag value` or `--flag=value` pair from argv (undefined if absent). */
function flagValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(name);
  if (i !== -1 && i + 1 < args.length) return args[i + 1];
  const inline = args.find((a) => a.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : undefined;
}

/** Presence of a boolean `--flag` in argv. */
function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(name);
}

main().catch((error) => {
  console.error(`✘ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
