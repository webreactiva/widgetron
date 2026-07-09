import * as React from "react";
import { X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export interface MermaidNodeDetail {
  /** Node id in the chart whose rendered svg node opens this detail on click. */
  id: string;
  title: React.ReactNode;
  description: React.ReactNode;
}

export interface MermaidDiagramLabels {
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  close: string;
  loading: React.ReactNode;
  error: React.ReactNode;
}

export const DEFAULT_MERMAID_DIAGRAM_LABELS: MermaidDiagramLabels = {
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  zoomReset: "Reset zoom",
  close: "Close",
  loading: "Rendering diagram…",
  error: "Could not render diagram.",
};

export interface MermaidDiagramProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Mermaid diagram source (e.g. a flowchart definition). */
  chart: string;
  /** Optional clickable-node details, keyed by node id in the chart. */
  details?: MermaidNodeDetail[];
  /** Enable zoom buttons, mouse-wheel zoom and click-drag panning. */
  zoomable?: boolean;
  labels?: Partial<MermaidDiagramLabels>;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Inline control icons (the shared icon set has no plus/minus/reset glyphs). */
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function ResetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

/** Read a resolved color from the container's computed style, with a fallback. */
function readVar(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: string,
): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

/**
 * MermaidDiagram — renders a Mermaid chart into the active theme. Mermaid is
 * loaded with a DYNAMIC `import("mermaid")` (it stays out of the main bundle
 * and off the server) and its theme variables are resolved from the live CSS
 * custom properties on the container, so the diagram matches whatever theme is
 * active at mount. Optionally zoomable (buttons / wheel / drag-pan / pinch) and with
 * clickable nodes that open an aseptic detail overlay (Escape closes).
 */
export function MermaidDiagram({
  chart,
  details = [],
  zoomable = false,
  labels,
  className,
  ...props
}: MermaidDiagramProps) {
  const l = useLabels("mermaidDiagram", DEFAULT_MERMAID_DIAGRAM_LABELS, labels);

  // A stable, deterministic id for the mermaid render call (no Math.random).
  const reactId = React.useId();
  const renderId = React.useMemo(
    () => `mermaid-${reactId.replace(/:/g, "")}`,
    [reactId],
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<HTMLDivElement>(null);

  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [activeDetail, setActiveDetail] =
    React.useState<MermaidNodeDetail | null>(null);

  // Zoom + pan are driven imperatively from refs so wheel/drag handlers stay
  // cheap and never fight a React-managed inline transform (single source of
  // truth: `applyTransform` writes the full translate+scale to the DOM).
  const scaleRef = React.useRef(1);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sizerRef = React.useRef<HTMLDivElement>(null);
  const baseSizeRef = React.useRef({ w: 0, h: 0 });

  const reduceMotion = prefersReducedMotion();

  // Keep `details` referentially stable for the render effect dependency.
  const detailsKey = React.useMemo(
    () => details.map((d) => d.id).join("|"),
    [details],
  );

  // Scale the chart and reserve real layout space in the sizer so the scroll
  // container gets true scrollbars (panning = native scroll, never traps page).
  const applyTransform = React.useCallback(() => {
    const el = chartRef.current;
    if (!el) return;
    el.style.transform = `scale(${scaleRef.current})`;
    const sizer = sizerRef.current;
    const { w, h } = baseSizeRef.current;
    if (sizer && w) {
      sizer.style.width = `${w * scaleRef.current}px`;
      sizer.style.height = `${h * scaleRef.current}px`;
    }
  }, []);

  const setScaleClamped = React.useCallback(
    (next: number) => {
      scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      applyTransform();
    },
    [applyTransform],
  );

  const resetView = React.useCallback(() => {
    setScaleClamped(1);
    const s = scrollRef.current;
    if (s) {
      s.scrollLeft = 0;
      s.scrollTop = 0;
    }
  }, [setScaleClamped]);

  // --- Render the diagram (dynamic mermaid import) -------------------------
  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      const host = chartRef.current;
      const container = containerRef.current;
      if (!host || !container) return;

      setStatus("loading");

      // Resolve theme colors from the live CSS variables on the container so
      // mermaid (which needs concrete colors, not CSS vars) matches the theme.
      const styles = getComputedStyle(container);
      const primary = readVar(styles, "--primary", "#18181b");
      const secondary = readVar(styles, "--secondary", "#f4f4f5");
      const card = readVar(styles, "--card", "#ffffff");
      const foreground = readVar(styles, "--foreground", "#18181b");
      const border = readVar(styles, "--border", "#e4e4e7");
      const muted = readVar(styles, "--muted", "#f4f4f5");
      const fontFamily =
        readVar(styles, "--font-sans", "") ||
        "ui-sans-serif, system-ui, -apple-system, sans-serif";

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: "base",
          themeVariables: {
            primaryColor: secondary,
            primaryBorderColor: primary,
            primaryTextColor: foreground,
            secondaryColor: muted,
            secondaryBorderColor: border,
            tertiaryColor: card,
            tertiaryBorderColor: border,
            lineColor: foreground,
            textColor: foreground,
            background: card,
            mainBkg: secondary,
            nodeBorder: primary,
            clusterBkg: muted,
            clusterBorder: border,
            fontFamily,
            fontSize: "14px",
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 15,
          },
        });

        const { svg } = await mermaid.render(renderId, chart);
        if (cancelled) return;

        host.innerHTML = svg;

        const svgEl = host.querySelector("svg");
        if (svgEl) {
          const vb = svgEl.viewBox?.baseVal;
          const natW = vb && vb.width ? vb.width : svgEl.clientWidth || 640;
          const natH = vb && vb.height ? vb.height : svgEl.clientHeight || 360;
          baseSizeRef.current = { w: natW, h: natH };
          svgEl.style.width = "100%";
          svgEl.style.height = "100%";
          svgEl.style.display = "block";
          host.style.width = `${natW}px`;
          host.style.height = `${natH}px`;
          // Fit to the available width on first render; zoom in for detail.
          const avail = (containerRef.current?.clientWidth ?? natW) - 32;
          const fit = natW > 0 ? Math.min(1, avail / natW) : 1;
          scaleRef.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, fit));
        }

        applyTransform();
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("MermaidDiagram render error:", err);
        host.innerHTML = "";
        setStatus("error");
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
    // renderId is stable; re-render when the chart source changes.
  }, [chart, renderId, applyTransform]);

  // --- Attach click handlers to nodes that have a matching detail ----------
  React.useEffect(() => {
    if (status !== "ready" || details.length === 0) return;
    const host = chartRef.current;
    if (!host) return;

    const cleanups: Array<() => void> = [];

    for (const detail of details) {
      // Mermaid prefixes node ids; a substring match finds the rendered node.
      const node = host.querySelector<SVGGElement>(`[id*='${detail.id}']`);
      if (!node) continue;
      node.classList.add("cursor-pointer");
      const handler = (e: Event) => {
        e.stopPropagation();
        setActiveDetail(detail);
      };
      node.addEventListener("click", handler);
      cleanups.push(() => node.removeEventListener("click", handler));
    }

    return () => {
      for (const clean of cleanups) clean();
    };
  }, [status, detailsKey, details]);

  // --- Escape closes the detail overlay ------------------------------------
  React.useEffect(() => {
    if (!activeDetail) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveDetail(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeDetail]);

  // --- Wheel zoom ----------------------------------------------------------
  React.useEffect(() => {
    if (!zoomable) return;
    const container = scrollRef.current;
    if (!container) return;

    function onWheel(e: WheelEvent) {
      // Only hijack the wheel for zoom when Ctrl/⌘ is held; otherwise let the
      // page scroll normally (don't trap the scroll over the diagram).
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScaleClamped(scaleRef.current + delta);
    }

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [zoomable, setScaleClamped]);

  // --- Click-drag panning --------------------------------------------------
  React.useEffect(() => {
    if (!zoomable) return;
    const container = containerRef.current;
    if (!container) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    function onMouseDown(e: MouseEvent) {
      if (!container) return;
      // Let clicks on a clickable node fall through to its detail handler.
      if ((e.target as Element | null)?.closest(".cursor-pointer")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originLeft = container.scrollLeft;
      originTop = container.scrollTop;
      container.classList.add("cursor-grabbing");
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging || !container) return;
      e.preventDefault();
      // Drag pans by scrolling the canvas — never moves the page.
      container.scrollLeft = originLeft - (e.clientX - startX);
      container.scrollTop = originTop - (e.clientY - startY);
    }

    function onMouseUp() {
      if (!dragging || !container) return;
      dragging = false;
      container.classList.remove("cursor-grabbing");
    }

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [zoomable]);

  // --- Pinch-to-zoom (touch) ----------------------------------------------
  // Desktop zooms with the wheel/buttons; touch had neither gesture. One-finger
  // pan stays native (scrollRef is overflow-auto + touch-action pan-x/pan-y);
  // two fingers drive the scale by their distance ratio.
  React.useEffect(() => {
    if (!zoomable) return;
    const surface = scrollRef.current;
    if (!surface) return;

    const active = new Map<number, { x: number; y: number }>();
    let startDist = 0;
    let startScale = 1;
    const spread = () => {
      const [a, b] = [...active.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "touch") return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (active.size === 2) {
        startDist = spread();
        startScale = scaleRef.current;
      }
    }
    function onPointerMove(e: PointerEvent) {
      if (!active.has(e.pointerId)) return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (active.size === 2 && startDist > 0) {
        e.preventDefault(); // hold the native scroll while pinching
        setScaleClamped(startScale * (spread() / startDist));
      }
    }
    function onPointerUp(e: PointerEvent) {
      active.delete(e.pointerId);
      if (active.size < 2) startDist = 0;
    }

    surface.addEventListener("pointerdown", onPointerDown);
    surface.addEventListener("pointermove", onPointerMove, { passive: false });
    surface.addEventListener("pointerup", onPointerUp);
    surface.addEventListener("pointercancel", onPointerUp);
    return () => {
      surface.removeEventListener("pointerdown", onPointerDown);
      surface.removeEventListener("pointermove", onPointerMove);
      surface.removeEventListener("pointerup", onPointerUp);
      surface.removeEventListener("pointercancel", onPointerUp);
    };
  }, [zoomable, setScaleClamped]);

  return (
    <div
      ref={containerRef}
      data-slot="mermaid-diagram"
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {zoomable && (
        <div className="absolute right-2 top-2 z-20 flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={l.zoomIn}
            onClick={() => setScaleClamped(scaleRef.current + 0.25)}
          >
            <PlusIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={l.zoomOut}
            onClick={() => setScaleClamped(scaleRef.current - 0.25)}
          >
            <MinusIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={l.zoomReset}
            onClick={resetView}
          >
            <ResetIcon className="size-4" />
          </Button>
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "relative max-h-[30rem] overflow-auto overscroll-contain rounded-md [scrollbar-width:thin]",
          // pan-x/pan-y keeps one-finger pan native but frees two-finger pinch
          // for the zoom handler (the browser won't page-zoom over the diagram).
          zoomable && "cursor-grab [touch-action:pan-x_pan-y]",
        )}
      >
        <div ref={sizerRef} className="mx-auto min-h-[10rem]">
          <div
            ref={chartRef}
            className={cn(
              "origin-top-left",
              !reduceMotion && "transition-transform duration-150 ease-out",
            )}
          />
        </div>
      </div>

      {status === "loading" && (
        <p
          aria-live="polite"
          className="absolute inset-x-0 bottom-2 text-center text-sm text-muted-foreground"
        >
          {l.loading}
        </p>
      )}

      {status === "error" && (
        <p
          role="alert"
          className="text-center text-sm text-muted-foreground"
        >
          {l.error}
        </p>
      )}

      {activeDetail && (
        <div
          className={cn(
            "absolute inset-0 z-30 flex items-center justify-center bg-card/85 p-4 backdrop-blur-sm",
            !reduceMotion && "animate-in fade-in",
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDetail(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-live="polite"
            className="relative w-[90%] max-w-md rounded-lg border border-primary bg-card p-6 text-card-foreground shadow-wgt"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={l.close}
              className="absolute right-2 top-2 size-8"
              onClick={() => setActiveDetail(null)}
            >
              <X className="size-4" />
            </Button>
            <h4 className="mb-2 pr-8 text-lg font-bold text-primary">
              <RichText>{activeDetail.title}</RichText>
            </h4>
            <p className="text-sm leading-relaxed">
              <RichText>{activeDetail.description}</RichText>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

MermaidDiagram.displayName = "MermaidDiagram";
