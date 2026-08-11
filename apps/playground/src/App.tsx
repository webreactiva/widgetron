import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { catalog, categories } from "./catalog";
import {
  ViewportFrame,
  VIEWPORTS,
  type Lang,
  type Viewport,
} from "./components/ViewportFrame";

type Theme = "base" | "webreactiva" | "podyscroll";

const VIEWPORT_ORDER: Viewport[] = ["mobile", "tablet", "desktop", "full"];

const byId = Object.fromEntries(catalog.map((entry) => [entry.id, entry]));

export function App() {
  const [activeId, setActiveId] = useState(catalog[0]?.id ?? "");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [theme, setTheme] = useState<Theme>("podyscroll");
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>("es");
  const [query, setQuery] = useState("");

  const filterRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const active = byId[activeId] ?? catalog[0];

  // Filter the sidebar by widget name. Empty categories drop out; `visibleIds`
  // is the flat, in-order list keyboard nav walks.
  const { visibleCategories, visibleIds } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = categories
      .map((cat) => ({
        title: cat.title,
        ids: cat.ids.filter((id) => {
          const entry = byId[id];
          return entry && (!q || entry.name.toLowerCase().includes(q));
        }),
      }))
      .filter((cat) => cat.ids.length > 0);
    return {
      visibleCategories: groups,
      visibleIds: groups.flatMap((cat) => cat.ids),
    };
  }, [query]);

  // Keyboard: "/" focuses the filter; ↑/↓ (or j/k) walk the visible list.
  useEffect(() => {
    const move = (dir: 1 | -1) => {
      if (visibleIds.length === 0) return;
      const i = visibleIds.indexOf(activeId);
      const next =
        i === -1
          ? dir === 1
            ? 0
            : visibleIds.length - 1
          : (i + dir + visibleIds.length) % visibleIds.length;
      setActiveId(visibleIds[next]);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        filterRef.current?.focus();
        return;
      }
      if (typing) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        move(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleIds, activeId]);

  // Keep the active item in view when nav moves it.
  useEffect(() => {
    navRef.current
      ?.querySelector(`[data-widget-id="${activeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const onFilterKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      filterRef.current?.blur();
    } else if ((e.key === "Enter" || e.key === "ArrowDown") && visibleIds.length) {
      e.preventDefault();
      setActiveId(visibleIds[0]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:h-screen md:overflow-hidden">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border px-5 py-3">
        <div className="mr-auto flex items-baseline gap-2">
          <span className="font-display text-lg font-bold">Widgetron</span>
          <span className="text-xs text-muted-foreground">
            playground · {catalog.length} widgets
          </span>
        </div>

        <Segmented
          label="Viewport"
          value={viewport}
          options={VIEWPORT_ORDER.map((v) => ({
            value: v,
            label: VIEWPORTS[v].label.split(" ")[0],
          }))}
          onChange={(v) => setViewport(v as Viewport)}
        />

        <Segmented
          label="Theme"
          value={theme}
          options={[
            { value: "base", label: "Base" },
            { value: "webreactiva", label: "Web Reactiva" },
            { value: "podyscroll", label: "Podyscroll" },
          ]}
          onChange={(v) => setTheme(v as Theme)}
        />

        <Segmented
          label="Lang"
          value={lang}
          options={[
            { value: "en", label: "EN" },
            { value: "es", label: "ES" },
          ]}
          onChange={(v) => setLang(v as Lang)}
        />

        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          {dark ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        {/* Sidebar grouped by category */}
        <nav
          ref={navRef}
          className="shrink-0 border-b border-border p-3 md:h-full md:w-64 md:overflow-y-auto md:border-b-0 md:border-r"
        >
          {/* Filter */}
          <div className="sticky top-0 z-10 -mx-3 mb-3 bg-background/95 px-3 pb-2 pt-0.5 backdrop-blur">
            <div className="relative">
              <input
                ref={filterRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onFilterKey}
                aria-label="Filter widgets"
                placeholder="Filter widgets…"
                className="w-full rounded-md border border-input bg-background py-1.5 pl-3 pr-8 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    filterRef.current?.focus();
                  }}
                  aria-label="Clear filter"
                  className="absolute inset-y-0 right-1 my-auto grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  ×
                </button>
              ) : (
                <kbd className="pointer-events-none absolute inset-y-0 right-2 my-auto h-5 rounded border border-border px-1.5 text-[11px] leading-5 text-muted-foreground/70">
                  /
                </kbd>
              )}
            </div>
            {query ? (
              <p className="mt-1.5 px-0.5 text-[11px] text-muted-foreground">
                {visibleIds.length} of {catalog.length}
              </p>
            ) : null}
          </div>

          {visibleCategories.map((cat) => (
            <div key={cat.title} className="mb-4">
              <p className="flex items-baseline justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                <span>{cat.title}</span>
                <span className="tabular-nums text-muted-foreground/50">
                  {cat.ids.length}
                </span>
              </p>
              <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
                {cat.ids.map((id) => {
                  const entry = byId[id];
                  if (!entry) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        data-widget-id={id}
                        onClick={() => setActiveId(id)}
                        className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                          id === active?.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent"
                        }`}
                      >
                        {entry.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {visibleCategories.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No widgets match “{query}”.
            </p>
          )}
        </nav>

        {/* Stage */}
        <main className="flex-1 overflow-auto bg-muted/40 p-5 sm:p-8">
          {active && (
            <div className="mx-auto max-w-5xl">
              <h1 className="font-display text-2xl font-bold">{active.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {active.summary}
              </p>

              <div className="mt-8 flex flex-col gap-10">
                {active.demos.map((demo) => (
                  <section key={demo.label}>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {demo.label}
                    </h2>
                    <ViewportFrame
                      viewport={viewport}
                      theme={theme}
                      dark={dark}
                      lang={lang}
                    >
                      {demo.node}
                    </ViewportFrame>
                  </section>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface SegmentedProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function Segmented({ label, value, options, onChange }: SegmentedProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {label}
      </span>
      <div className="flex rounded-md border border-input p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
