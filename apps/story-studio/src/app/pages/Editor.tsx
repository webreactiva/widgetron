import * as React from "react";
import {
  WidgetronProvider,
  renderWidget,
  esLabels,
} from "@webreactiva/widgetron";

import { validateStoryDocument } from "../../engine/validate";
import type { WidgetNode } from "../../engine/core";

/**
 * The authoring screen (decision D-003): dev-server only, no auth, no editKey.
 * Left: the raw .story.json with LIVE full validation (envelope + widget tree,
 * same error paths `story validate` prints). Right: instant preview of the
 * RESOLVED tree. Save = PUT to the dev API = the file changes on disk (git is
 * the review layer). Export = the same pipeline as `story render`.
 */
export function Editor({ slug }: { slug: string }) {
  const [text, setText] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/stories/${slug}`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status}`))))
      .then(setText)
      .catch((e) => setStatus(`Could not load document: ${e}`));
  }, [slug]);

  if (!import.meta.env.DEV) {
    return (
      <p className="text-muted-foreground">
        The editor only exists on the local dev server (see docs/story-studio-decisions.md, D-003).
      </p>
    );
  }
  if (text === null) return <p className="text-muted-foreground">{status || "Loading…"}</p>;

  let parsed: unknown = null;
  let parseError: string | null = null;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    parseError = e instanceof Error ? e.message : String(e);
  }
  const validation = parseError ? null : validateStoryDocument(parsed);
  const valid = !parseError && validation?.valid === true;
  const errors = parseError ? [`JSON: ${parseError}`] : (validation?.errors ?? []);

  const save = async () => {
    setBusy(true);
    setStatus("Saving…");
    try {
      const res = await fetch(`/api/stories/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const body = await res.json();
      setStatus(res.ok ? `Saved → ${body.file}` : `Save failed: ${body.error}`);
    } catch (e) {
      setStatus(`Save failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const exportHtml = async () => {
    setBusy(true);
    setStatus("Exporting (vite build)…");
    try {
      const res = await fetch(`/api/export/${slug}`, { method: "POST" });
      const body = await res.json();
      setStatus(
        res.ok
          ? `Exported → ${body.outDir} (self-contained, ready to upload)`
          : `Export failed: ${body.error}`,
      );
    } catch (e) {
      setStatus(`Export failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="me-auto text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {slug}.story.json
          </h2>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={save}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={exportHtml}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Export HTML
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="min-h-[60dvh] w-full resize-y rounded-lg border bg-card p-3 font-mono text-xs leading-relaxed text-card-foreground"
        />
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {errors.length > 0 && (
          <div className="rounded-lg border border-destructive/40 p-3">
            <p className="text-sm font-medium text-destructive">
              {errors.length} error(s):
            </p>
            <ul className="mt-1 list-disc ps-5 text-xs text-muted-foreground">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="min-w-0">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Preview (resolved tree)
        </h2>
        {valid && validation?.resolved && validation.document ? (
          <PreviewPane
            resolved={validation.resolved}
            lang={validation.document.meta.lang}
            theme={validation.document.meta.theme}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Fix the errors to see the preview.
          </p>
        )}
      </section>
    </div>
  );
}

function PreviewPane({
  resolved,
  lang,
  theme,
}: {
  resolved: WidgetNode;
  lang?: string;
  theme?: string;
}) {
  const story: WidgetNode = {
    ...resolved,
    props: { ...(resolved.props ?? {}), className: "h-[70dvh]" },
  };
  return (
    <div data-theme={theme}>
      <WidgetronProvider
        locale={lang}
        labels={lang?.startsWith("es") ? esLabels : undefined}
        iconSet={theme === "webreactiva" ? "pixelarticons" : undefined}
      >
        {renderWidget(story)}
      </WidgetronProvider>
    </div>
  );
}
