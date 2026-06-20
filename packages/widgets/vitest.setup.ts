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
