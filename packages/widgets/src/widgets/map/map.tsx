import * as React from "react";
import type * as L from "leaflet";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";
import {
  loadLeaflet,
  cartoTileLayer,
  isDarkContext,
  addMarkers,
  readToken,
  type MapMarker,
} from "@/lib/leaflet";

export interface MapLabels {
  loading: React.ReactNode;
  error: React.ReactNode;
}

export const DEFAULT_MAP_LABELS: MapLabels = {
  loading: "Loading map…",
  error: "Could not load the map.",
};

export interface MapProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Map center as [latitude, longitude]. */
  center: [number, number];
  /** Zoom level (roughly 1 world → 18 street). Default: 12. */
  zoom?: number;
  /** Pins to drop, each with an optional click-to-open label. */
  markers?: MapMarker[];
  /** CSS height of the map (Leaflet needs an explicit height). Default: "24rem". */
  height?: string;
  /** Let the mouse wheel zoom the map (off by default so it never traps page scroll). */
  scrollWheelZoom?: boolean;
  /** Accessible name for the map region. */
  title?: string;
  caption?: React.ReactNode;
  labels?: Partial<MapLabels>;
}

/**
 * Map — an interactive slippy map, rendered with imperative Leaflet loaded via a
 * dynamic `import()` (optional dependency; out of the main bundle and off the
 * server, like `mermaid`). Token-free Carto basemap, matched to the active
 * light/dark theme; markers are theme-colored circles (no image assets). Wheel
 * zoom is off by default so an embedded map never hijacks page scroll.
 *
 * Consumers must load Leaflet's stylesheet once: `import "leaflet/dist/leaflet.css"`.
 */
export function Map({
  center,
  zoom = 12,
  markers = [],
  height = "24rem",
  scrollWheelZoom = false,
  title,
  caption,
  labels,
  className,
  ...props
}: MapProps) {
  const l = useLabels("map", DEFAULT_MAP_LABELS, labels);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapElRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading",
  );

  const markersKey = React.useMemo(() => JSON.stringify(markers), [markers]);

  React.useEffect(() => {
    let cancelled = false;
    let map: L.Map | undefined;
    let ro: ResizeObserver | undefined;

    async function init() {
      const el = mapElRef.current;
      const container = containerRef.current;
      if (!el || !container) return;
      setStatus("loading");
      try {
        const lib = await loadLeaflet();
        if (cancelled) return;
        map = lib.map(el, {
          center,
          zoom,
          scrollWheelZoom,
          // Keep touch/drag panning; the reader always controls the wheel.
          attributionControl: true,
        });
        cartoTileLayer(lib, isDarkContext(container)).addTo(map);
        const group = lib.layerGroup().addTo(map);
        addMarkers(lib, group, markers, readToken(container, "--primary", "#3b82f6"));
        // Leaflet caches the container size at init. In a scroll flow (e.g. a
        // storyline) the map often mounts before its box is finally sized, which
        // offsets the tiles into an L-shape. A ResizeObserver fires once on
        // observe and on every later resize, so the map always re-measures.
        ro = new ResizeObserver(() => map?.invalidateSize());
        ro.observe(el);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error("Map load error:", err);
        setStatus("error");
      }
    }

    void init();
    return () => {
      cancelled = true;
      ro?.disconnect();
      map?.remove();
    };
    // center/zoom are the initial view; re-init when they or markers change.
  }, [center, zoom, scrollWheelZoom, markersKey, markers]);

  return (
    <figure
      ref={containerRef}
      data-slot="map"
      className={cn(
        "m-0 overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="relative" style={{ height }}>
        <div
          ref={mapElRef}
          role="application"
          aria-label={title ?? "Map"}
          className="h-full w-full"
        />
        {status !== "ready" ? (
          <p
            aria-live="polite"
            role={status === "error" ? "alert" : undefined}
            className="absolute inset-0 z-[400] flex items-center justify-center bg-card/80 text-sm text-muted-foreground"
          >
            {status === "error" ? l.error : l.loading}
          </p>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="px-4 py-3 text-sm text-muted-foreground">
          <RichText>{caption}</RichText>
        </figcaption>
      ) : null}
    </figure>
  );
}

Map.displayName = "Map";
