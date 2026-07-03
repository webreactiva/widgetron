import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Story Studio CLI — the same engine the app and the dev API use.
 *
 *   pnpm --filter @webreactiva/story-studio story validate <slug|path>
 *   pnpm --filter @webreactiva/story-studio story render <slug>
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
      const outDir = await renderStory(target, { appRoot });
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
      usage("validate|render|theme|manifest …");
  }
}

function usage(hint: string): never {
  console.error(`Usage: story ${hint}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(`✘ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
