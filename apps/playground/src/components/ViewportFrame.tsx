import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { esLabels, WidgetronProvider } from "@webreactiva/widgetron";

export type Viewport = "mobile" | "tablet" | "desktop" | "full";
export type Lang = "en" | "es";

export const VIEWPORTS: Record<
  Viewport,
  { label: string; width: number | null; height: number | null }
> = {
  // Portrait device heights for mobile/tablet so the frame feels like a real
  // phone/tablet (content scrolls inside). Desktop/full size to content.
  mobile: { label: "Mobile · 390 × 844", width: 390, height: 844 },
  tablet: { label: "Tablet · 768 × 1024", width: 768, height: 1024 },
  desktop: { label: "Desktop · 1280px", width: 1280, height: null },
  full: { label: "Full width", width: null, height: null },
};

/** The icon collection each theme ships with (part of the theme). */
const THEME_ICON_SET: Record<"base" | "webreactiva" | "podyscroll", string> = {
  base: "lucide",
  webreactiva: "pixelarticons",
  podyscroll: "pixelarticons",
};

// Cap the content-sized (desktop/full) frame height. Without a cap, content that
// uses viewport units (e.g. scrollytelling's min-h-[70vh]) feeds back into the
// auto-height and grows without bound; tall content instead scrolls in-frame.
const MAX_AUTO_HEIGHT = 820;

interface ViewportFrameProps {
  viewport: Viewport;
  theme: "base" | "webreactiva" | "podyscroll";
  dark: boolean;
  lang: Lang;
  children: ReactNode;
}

/** Clone the host page's stylesheets into the iframe so Tailwind + tokens apply. */
function syncStyles(doc: Document) {
  doc.head.querySelectorAll("[data-wgt-style]").forEach((n) => n.remove());
  document
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.setAttribute("data-wgt-style", "");
      doc.head.appendChild(clone);
    });
}

/**
 * Renders a widget inside a real <iframe> sized to the chosen viewport. Because
 * the iframe has its own viewport, `sm:` / `md:` media queries AND container
 * queries evaluate against the frame width — so "Mobile · 390px" is a *truthful*
 * 390px device, not a shrunken desktop. The theme/locale/icon-set are scoped to
 * the frame via WidgetronProvider + data-theme.
 */
export function ViewportFrame({
  viewport,
  theme,
  dark,
  lang,
  children,
}: ViewportFrameProps) {
  const { label, width, height: fixedHeight } = VIEWPORTS[viewport];
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rootRef = useRef<Root | null>(null);
  const mountRef = useRef<HTMLElement | null>(null);
  const [, setReady] = useState(0);
  const [autoHeight, setAutoHeight] = useState(260);

  // One-time iframe document setup: mount node, styles, observers, React root.
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;

    doc.documentElement.lang = "en";
    doc.body.style.margin = "0";

    const node = doc.createElement("div");
    doc.body.appendChild(node);
    mountRef.current = node;

    syncStyles(doc);
    const headObserver = new MutationObserver(() => syncStyles(doc));
    headObserver.observe(document.head, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(() => {
      setAutoHeight(Math.min(Math.max(node.scrollHeight, 80), MAX_AUTO_HEIGHT));
    });
    resizeObserver.observe(node);

    rootRef.current = createRoot(node);
    setReady((n) => n + 1);

    return () => {
      headObserver.disconnect();
      resizeObserver.disconnect();
      const root = rootRef.current;
      rootRef.current = null;
      // Defer unmount to avoid React "synchronous unmount during render" warning.
      queueMicrotask(() => root?.unmount());
    };
  }, []);

  // Re-render the framed content whenever the demo or theme/lang changes.
  useEffect(() => {
    rootRef.current?.render(
      <div
        data-theme={theme === "base" ? undefined : theme}
        className={`${dark ? "dark " : ""}min-h-64 bg-background p-5 text-foreground`}
      >
        <WidgetronProvider
          iconSet={THEME_ICON_SET[theme]}
          locale={lang === "es" ? "es-ES" : "en-US"}
          labels={lang === "es" ? esLabels : undefined}
        >
          {children}
        </WidgetronProvider>
      </div>,
    );
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div
        className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-[width] duration-200"
        style={{ width: width ?? "100%", maxWidth: "100%" }}
      >
        <iframe
          ref={iframeRef}
          title={`Preview · ${label}`}
          className="block w-full border-0"
          style={{ height: fixedHeight ?? autoHeight }}
        />
      </div>
    </div>
  );
}
