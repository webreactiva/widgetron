import type * as L from "leaflet";

/**
 * Lazy Leaflet loader + shared tile/marker helpers for the `map` and
 * `story-map` widgets. Leaflet is an OPTIONAL dependency and is pulled in with a
 * dynamic `import()` (kept out of the main bundle and off the server, exactly
 * like `mermaid`). It is imperative Leaflet, not react-leaflet — react-leaflet
 * v5 is Hippocratic-2.1 (not OSI); plain Leaflet is BSD-2.
 *
 * Consumers must load Leaflet's stylesheet once for the map to lay out:
 *   import "leaflet/dist/leaflet.css";
 */

export type LeafletModule = typeof L;

let cached: Promise<LeafletModule> | undefined;

/** Load Leaflet once, tolerating both ESM-namespace and CJS-default shapes. */
export function loadLeaflet(): Promise<LeafletModule> {
  if (!cached) {
    cached = import("leaflet").then(
      (m) => (m as unknown as { default?: LeafletModule }).default ?? m,
    );
  }
  return cached;
}

/** Is this element inside a `.dark` subtree? Picks the light vs dark basemap. */
export function isDarkContext(el: Element | null): boolean {
  return !!el?.closest(".dark");
}

/**
 * Carto's token-free basemap, theme-matched. Carto light_all / dark_all need no
 * API key and are production-usable; OSM + CARTO attribution is mandatory and
 * baked in here.
 */
export function cartoTileLayer(lib: LeafletModule, dark: boolean): L.TileLayer {
  const variant = dark ? "dark_all" : "light_all";
  return lib.tileLayer(
    `https://{s}.basemaps.cartocdn.com/${variant}/{z}/{x}/{y}{r}.png`,
    {
      subdomains: "abcd",
      maxZoom: 20,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  );
}

export interface MapMarker {
  lat: number;
  lng: number;
  /** Short plain-text popup label (opens on click). */
  label?: string;
}

/**
 * A theme-colored circle marker — pure SVG, no image asset, so it never hits
 * Leaflet's broken-default-icon bundler problem. Color comes from the live
 * `--primary` token read off the container.
 */
export function addMarkers(
  lib: LeafletModule,
  group: L.LayerGroup,
  markers: MapMarker[],
  primary: string,
): void {
  for (const m of markers) {
    const marker = lib.circleMarker([m.lat, m.lng], {
      radius: 7,
      color: primary,
      weight: 2,
      fillColor: primary,
      fillOpacity: 0.65,
    });
    if (m.label) marker.bindPopup(m.label);
    marker.addTo(group);
  }
}

/** Resolve a live CSS token off the container, with a fallback. */
export function readToken(el: Element, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}
