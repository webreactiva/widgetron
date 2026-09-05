import "@testing-library/jest-dom/vitest";

// jsdom does not expose localStorage for opaque origins; provide a minimal
// in-memory implementation so persistence-backed widgets are testable.
let hasStorage = false;
try {
  hasStorage = typeof window !== "undefined" && !!window.localStorage;
} catch {
  hasStorage = false;
}

if (typeof window !== "undefined" && !hasStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value));
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

/**
 * jsdom ships no 2D canvas: `getContext("2d")` throws a "not implemented"
 * error and prints a stack for every call. Widgets that use a canvas already
 * treat a missing context as "fall back" (MermaidDiagram normalizes theme
 * colours through one), so returning null here exercises the same branch
 * honestly and keeps the suite's output readable — a run nobody reads is a run
 * nobody notices going red.
 */
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as HTMLCanvasElement["getContext"];
}
