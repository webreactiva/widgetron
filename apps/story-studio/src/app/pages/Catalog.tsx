import * as React from "react";
import { readStorylineProgress } from "@webreactiva/widgetron";

import { navigate } from "../App";

interface StoryIndexEntry {
  slug: string;
  meta: { title?: string; lang?: string; theme?: string; description?: string };
  /** Estimated reading time (dev API, whole minutes). */
  minutes?: number;
  error: string | null;
}

export function Catalog() {
  const [stories, setStories] = React.useState<StoryIndexEntry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/stories")
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status} — is this the dev server?`);
        return r.json();
      })
      .then(setStories)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!stories) return <p className="text-muted-foreground">Loading…</p>;
  if (stories.length === 0) {
    return (
      <p className="text-muted-foreground">
        No guides yet — add a <code>content/&lt;slug&gt;.story.json</code>.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((s) => {
        // The storyline persists progress under its storageKey (= the slug).
        const progress = s.error ? null : readStorylineProgress(s.slug);
        const started = !!progress && !progress.done && progress.pct > 0;
        return (
          <article
            key={s.slug}
            className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-wgt"
          >
            <h2
              className="text-lg font-bold leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {s.meta.title ?? s.slug}
            </h2>
            {s.error ? (
              <p className="text-sm text-destructive">
                Unreadable JSON: {s.error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {s.meta.description ??
                  `${s.meta.lang ?? "?"} · theme: ${s.meta.theme ?? "aseptic"}`}
              </p>
            )}
            {!s.error && (
              <p className="text-xs text-muted-foreground">
                {progress?.done ? (
                  <span className="font-medium text-primary">Completed ✓</span>
                ) : started ? (
                  `In progress · ${progress!.pct}%`
                ) : s.minutes ? (
                  `~${s.minutes} min`
                ) : null}
              </p>
            )}
            {started && (
              <div className="h-1 overflow-hidden rounded-full bg-primary/15">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progress!.pct}%` }}
                />
              </div>
            )}
            <div className="mt-auto flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate(`/s/${s.slug}`)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              >
                {progress?.done ? "Review" : started ? "Continue" : "Start"}
              </button>
              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => navigate(`/s/${s.slug}/editar`)}
                  className="rounded-md border px-3 py-1.5 text-sm"
                >
                  Edit
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
