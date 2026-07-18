import * as React from "react";
import type * as L from "leaflet";

import { cn } from "@/lib/utils";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";
import {
  loadLeaflet,
  cartoTileLayer,
  isDarkContext,
  addMarkers,
  readToken,
  type MapMarker,
} from "@/lib/leaflet";

export interface StoryMapStep {
  /** The prose card that scrolls over the map. */
  content: React.ReactNode;
  /** Where the map flies to when this step becomes active, [lat, lng]. */
  center: [number, number];
  /** Zoom for this step. Default: 12. */
  zoom?: number;
  /** Pins shown while this step is active. */
  markers?: MapMarker[];
}

export interface StoryMapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 2–5 stops is the sweet spot. */
  steps: StoryMapStep[];
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * StoryMap — a guided map tour: the map pins to the reading pane and flies from
 * stop to stop as short prose cards scroll over it. Same sticky-scene + observer
 * recipe as `backdrop-section`, but the scene is an imperative Leaflet map that
 * `flyTo`s each step's center (a plain `setView` under reduced motion). Leaflet
 * is a dynamically-imported optional dependency; consumers load its stylesheet
 * once (`import "leaflet/dist/leaflet.css"`). Emits `step_viewed` on each stop.
 */
export function StoryMap({ steps, className, ...props }: StoryMapProps) {
  const { ref, emit } = useWidgetEvents("story-map");
  const mapElRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const groupRef = React.useRef<L.LayerGroup | null>(null);
  const libRef = React.useRef<Awaited<ReturnType<typeof loadLeaflet>> | null>(null);
  const primaryRef = React.useRef("#3b82f6");
  const stepRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  const lastEmittedRef = React.useRef(0);

  // --- Init the map once ---------------------------------------------------
  React.useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | undefined;
    const first = steps[0];
    async function init() {
      const el = mapElRef.current;
      const root = ref.current;
      if (!el || !root || !first) return;
      try {
        const lib = await loadLeaflet();
        if (cancelled || !mapElRef.current) return;
        primaryRef.current = readToken(root, "--primary", "#3b82f6");
        const map = lib.map(el, {
          center: first.center,
          zoom: first.zoom ?? 12,
          scrollWheelZoom: false,
          zoomControl: false,
          attributionControl: true,
          dragging: false,
          keyboard: false,
        });
        cartoTileLayer(lib, isDarkContext(root)).addTo(map);
        const group = lib.layerGroup().addTo(map);
        if (first.markers) addMarkers(lib, group, first.markers, primaryRef.current);
        libRef.current = lib;
        mapRef.current = map;
        groupRef.current = group;
        // The sticky scene mounts before its box is finally sized, which offsets
        // the tiles. A ResizeObserver fires once on observe and on every resize,
        // so the map re-measures instead of caching a wrong size.
        ro = new ResizeObserver(() => map.invalidateSize());
        ro.observe(el);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("StoryMap load error:", err);
      }
    }
    void init();
    return () => {
      cancelled = true;
      ro?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Re-init only if the whole tour is replaced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  // --- Track the active step (same recipe as backdrop-section) -------------
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const pane =
      (ref.current?.closest('[data-slot="storyline"]') as HTMLElement | null) ??
      null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.step);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { root: pane, rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [steps.length, ref]);

  // --- Fly to the active step ----------------------------------------------
  React.useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    const group = groupRef.current;
    const step = steps[active];
    if (!map || !lib || !group || !step) return;
    const zoom = step.zoom ?? 12;
    if (prefersReducedMotion()) map.setView(step.center, zoom, { animate: false });
    else map.flyTo(step.center, zoom, { duration: 1.1 });
    group.clearLayers();
    if (step.markers) addMarkers(lib, group, step.markers, primaryRef.current);
  }, [active, steps]);

  React.useEffect(() => {
    if (active === lastEmittedRef.current) return;
    lastEmittedRef.current = active;
    emit("step_viewed", { index: active, total: steps.length });
  }, [active, steps.length, emit]);

  return (
    <div
      ref={ref}
      data-slot="story-map"
      className={cn("@container relative", className)}
      {...props}
    >
      {/* Sticky map scene — pins against the nearest scroll container. */}
      <div className="sticky top-0 z-0 h-[100cqh] overflow-hidden" aria-hidden>
        <div ref={mapElRef} className="h-full w-full" />
        {/* Scrim keeps the cards legible over any basemap, both themes. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/50 via-background/10 to-background/50" />
      </div>

      {/* Prose cards scrolling over the map. */}
      <div className="relative z-10 -mt-[100cqh]">
        {steps.map((step, index) => (
          <div
            key={index}
            data-step={index}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            className="flex min-h-[85cqh] items-center justify-center px-6"
          >
            <div
              className={cn(
                "w-full max-w-prose rounded-lg border bg-card/85 p-5 text-card-foreground shadow-wgt backdrop-blur transition-opacity duration-(--motion-base)",
                index === active ? "opacity-100" : "opacity-60",
              )}
            >
              <div className="text-base leading-relaxed">
                <RichText>{step.content}</RichText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

StoryMap.displayName = "StoryMap";
