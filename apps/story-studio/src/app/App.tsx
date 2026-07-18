import * as React from "react";

import { Catalog } from "./pages/Catalog";
import { Player } from "./pages/Player";
import { Editor } from "./pages/Editor";
import { Passport } from "./pages/Passport";

export type Route =
  | { page: "catalog" }
  | { page: "passport" }
  | { page: "player"; slug: string }
  | { page: "editor"; slug: string };

function parseRoute(pathname: string): Route {
  if (/^\/pasaporte\/?$/.test(pathname)) return { page: "passport" };
  const m = pathname.match(/^\/s\/([a-z0-9-]+)(\/editar)?\/?$/);
  if (m) return m[2] ? { page: "editor", slug: m[1] } : { page: "player", slug: m[1] };
  return { page: "catalog" };
}

export function navigate(path: string): void {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// podyscroll is the product's own brand ("arcade honesto") and the default.
const THEMES = ["podyscroll", "aseptic", "webreactiva", "producto"] as const;

export function App() {
  const [route, setRoute] = React.useState<Route>(() =>
    parseRoute(window.location.pathname),
  );
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("story-studio-theme") ?? "podyscroll",
  );
  const [dark, setDark] = React.useState(
    () => localStorage.getItem("story-studio-dark") === "1",
  );

  React.useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  React.useEffect(() => {
    const el = document.documentElement;
    if (theme === "aseptic") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    el.classList.toggle("dark", dark);
    localStorage.setItem("story-studio-theme", theme);
    localStorage.setItem("story-studio-dark", dark ? "1" : "0");
  }, [theme, dark]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            className="font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Story Studio
          </a>
          <span className="text-xs text-muted-foreground">
            podcast → interactive guide
          </span>
          <div className="ms-auto flex items-center gap-2">
            <a
              href="/pasaporte"
              onClick={(e) => {
                e.preventDefault();
                navigate("/pasaporte");
              }}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              🎫 Passport
            </a>
            <select
              aria-label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
              aria-pressed={dark}
            >
              {dark ? "☾ dark" : "☀ light"}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {route.page === "catalog" && <Catalog />}
        {route.page === "passport" && <Passport />}
        {route.page === "player" && <Player slug={route.slug} onTheme={setTheme} />}
        {route.page === "editor" && <Editor slug={route.slug} />}
      </main>
    </div>
  );
}
