import * as React from "react";
import { readStorylineProgress } from "@webreactiva/widgetron";

import { navigate } from "../App";

interface StoryIndexEntry {
  slug: string;
  meta: { title?: string };
  /** Per-module stamp emojis ('' where a module declares none). */
  emojis?: string[];
  error: string | null;
}

/**
 * The reader's passport (M12): every guide's stamps in one place — earned in
 * color, pending as dimmed slots — plus completion state. Reads the same
 * localStorage the storylines write; nothing to sync, nothing to host.
 */
export function Passport() {
  const [stories, setStories] = React.useState<StoryIndexEntry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

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

  const rows = stories
    .filter((s) => !s.error)
    .map((s) => {
      const progress = readStorylineProgress(s.slug);
      const earned = new Set(progress?.stamps ?? []);
      const stamps = (s.emojis ?? [])
        .map((emoji, index) => ({ emoji, index, earned: earned.has(index) }))
        .filter((x) => x.emoji !== "");
      return {
        slug: s.slug,
        title: s.meta.title ?? s.slug,
        done: progress?.done === true,
        pct: progress?.pct ?? 0,
        stamps,
      };
    });

  const doneCount = rows.filter((r) => r.done).length;
  const earnedCount = rows.reduce(
    (n, r) => n + r.stamps.filter((s) => s.earned).length,
    0,
  );

  const copyPassport = () => {
    if (!navigator.clipboard) return;
    const lines = rows
      .filter((r) => r.done || r.stamps.some((s) => s.earned))
      .map((r) => {
        const seals = r.stamps
          .map((s) => (s.earned ? s.emoji : "·"))
          .join("");
        return `${r.done ? "✓" : `${r.pct}%`} ${r.title}${seals ? ` ${seals}` : ""}`;
      });
    const text = [
      `Mi pasaporte de guías — ${doneCount}/${rows.length} completadas 🏆`,
      ...lines,
    ].join("\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your passport
          </h1>
          <p className="text-sm text-muted-foreground">
            {doneCount}/{rows.length} guides completed · {earnedCount} stamps
          </p>
        </div>
        <button
          type="button"
          onClick={copyPassport}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:border-primary"
        >
          {copied ? "Copied!" : "Copy my passport"}
        </button>
      </header>

      <ol className="grid gap-3">
        {rows.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              onClick={() => navigate(`/s/${r.slug}`)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card p-4 text-left shadow-wgt hover:border-primary"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.title}</span>
                <span className="text-xs text-muted-foreground">
                  {r.done ? (
                    <span className="font-medium text-primary">Completed ✓</span>
                  ) : r.pct > 0 ? (
                    `In progress · ${r.pct}%`
                  ) : (
                    "Not started"
                  )}
                </span>
              </span>
              {r.stamps.length > 0 && (
                <span aria-hidden="true" className="flex gap-1.5 text-xl">
                  {r.stamps.map((s) => (
                    <span
                      key={s.index}
                      className={s.earned ? undefined : "opacity-25 grayscale"}
                    >
                      {s.emoji}
                    </span>
                  ))}
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
