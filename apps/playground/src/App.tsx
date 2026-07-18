import { useState } from "react";

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

  const active = byId[activeId] ?? catalog[0];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border px-5 py-3">
        <div className="mr-auto flex items-baseline gap-2">
          <span className="font-display text-lg font-bold">Widgetron</span>
          <span className="text-xs text-muted-foreground">playground</span>
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

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Sidebar grouped by category */}
        <nav className="shrink-0 border-b border-border p-3 md:w-64 md:border-b-0 md:border-r">
          {categories.map((cat) => (
            <div key={cat.title} className="mb-4">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {cat.title}
              </p>
              <ul className="flex flex-wrap gap-1 md:flex-col md:gap-0.5">
                {cat.ids.map((id) => {
                  const entry = byId[id];
                  if (!entry) return null;
                  return (
                    <li key={id}>
                      <button
                        type="button"
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
