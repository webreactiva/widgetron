import * as React from "react";

/**
 * Internationalization layer.
 *
 * Every user-facing string in a widget is customizable and translatable. There
 * are three layers, merged in priority order (later wins):
 *
 *   1. built-in English defaults (each widget exports its `DEFAULT_*_LABELS`)
 *   2. global overrides from `<WidgetronProvider labels={...} locale="..." />`
 *   3. per-instance `labels={...}` prop on the widget
 *
 * Label values may be strings, React nodes, or functions (for interpolation /
 * pluralization), so a single dictionary can localize the whole library.
 */

export interface WidgetronContextValue {
  /** BCP-47 locale for number formatting (e.g. "en-US", "es-ES"). */
  locale?: string;
  /** Global label overrides, keyed by widget id (e.g. "quiz", "flashcards"). */
  labels?: Record<string, Record<string, unknown>>;
  /**
   * Default Iconify collection for bare icon names (no prefix). Part of the
   * theme: base uses "lucide", the Web Reactiva theme uses "pixelarticons".
   */
  iconSet?: string;
}

const WidgetronContext = React.createContext<WidgetronContextValue>({});

export interface WidgetronProviderProps extends WidgetronContextValue {
  children: React.ReactNode;
}

/** Sets a global locale, label overrides and/or icon set for widgets underneath it. */
export function WidgetronProvider({
  locale,
  labels,
  iconSet,
  children,
}: WidgetronProviderProps) {
  const value = React.useMemo<WidgetronContextValue>(
    () => ({ locale, labels, iconSet }),
    [locale, labels, iconSet],
  );
  return (
    <WidgetronContext.Provider value={value}>
      {children}
    </WidgetronContext.Provider>
  );
}

export function useWidgetronConfig(): WidgetronContextValue {
  return React.useContext(WidgetronContext);
}

/** Merge defaults < global overrides < per-instance overrides. */
export function useLabels<T extends object>(
  widget: string,
  defaults: T,
  overrides?: Partial<T>,
): T {
  const { labels } = useWidgetronConfig();
  const fromContext = labels?.[widget] as Partial<T> | undefined;
  return React.useMemo(
    () => ({ ...defaults, ...(fromContext ?? {}), ...(overrides ?? {}) }) as T,
    [defaults, fromContext, overrides],
  );
}

/** Resolve the active locale: explicit prop wins, then provider, then runtime default. */
export function useLocale(explicit?: string): string | undefined {
  const { locale } = useWidgetronConfig();
  return explicit ?? locale;
}

/** Default Iconify collection prefix for the active theme. Defaults to "lucide". */
export const DEFAULT_ICON_SET = "lucide";

/** Resolve the active icon collection: explicit wins, then provider, then "lucide". */
export function useIconSet(explicit?: string): string {
  const { iconSet } = useWidgetronConfig();
  return explicit ?? iconSet ?? DEFAULT_ICON_SET;
}
