import * as React from "react";
import {
  WidgetronProvider,
  renderWidget,
  esLabels,
} from "@webreactiva/widgetron";

import { validateStoryDocument } from "../../engine/validate";
import type { StoryDocument, WidgetNode } from "../../engine/core";

/**
 * Reads a document and renders its RESOLVED tree — the same `resolveStory`
 * the render pipeline uses, so the preview is exactly what gets published.
 */
export function Player({
  slug,
  onTheme,
}: {
  slug: string;
  onTheme?: (theme: string) => void;
}) {
  const [state, setState] = React.useState<
    | { status: "loading" }
    | { status: "error"; errors: string[] }
    | { status: "ready"; document: StoryDocument; resolved: WidgetNode }
  >({ status: "loading" });

  React.useEffect(() => {
    setState({ status: "loading" });
    fetch(`/api/stories/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Document not found (${r.status})`);
        return r.json();
      })
      .then((raw) => {
        const result = validateStoryDocument(raw);
        if (!result.valid || !result.document || !result.resolved) {
          setState({ status: "error", errors: result.errors });
          return;
        }
        setState({
          status: "ready",
          document: result.document,
          resolved: result.resolved,
        });
        if (result.document.meta.theme) onTheme?.(result.document.meta.theme);
      })
      .catch((e) => setState({ status: "error", errors: [String(e)] }));
  }, [slug, onTheme]);

  if (state.status === "loading") {
    return <p className="text-muted-foreground">Loading…</p>;
  }
  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-card p-4">
        <p className="font-medium text-destructive">This document does not validate:</p>
        <ul className="mt-2 list-disc ps-5 text-sm text-muted-foreground">
          {state.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  const { document: doc, resolved } = state;
  const lang = doc.meta.lang;
  const story: WidgetNode = {
    ...resolved,
    props: {
      ...(resolved.props ?? {}),
      // Full-height reading pane (the widget defaults to h-[600px]).
      className: "h-[calc(100dvh-8rem)]",
    },
  };

  return (
    <WidgetronProvider
      locale={lang}
      labels={lang?.startsWith("es") ? esLabels : undefined}
      iconSet={doc.meta.theme === "webreactiva" ? "pixelarticons" : undefined}
    >
      <article>
        <h1 className="sr-only">{doc.meta.title}</h1>
        {renderWidget(story)}
      </article>
    </WidgetronProvider>
  );
}
