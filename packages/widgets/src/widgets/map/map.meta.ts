import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

const markerSchema = z.object({
  lat: z.number().describe("Latitude."),
  lng: z.number().describe("Longitude."),
  label: z
    .string()
    .optional()
    .describe("Short plain-text label shown in a popup on click."),
});

export const mapMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "An interactive slippy map (imperative Leaflet, token-free Carto basemap, theme-matched) with theme-colored pins.",
  whenToUse:
    "Use when place matters — where an event happened, where a company is, a route, the spread of something across a region. Drop `markers` for the specific points. Wheel-zoom is off by default so the map never hijacks page scroll (readers still drag and pinch). For a guided tour that flies between several places as the reader scrolls, use `story-map` instead; for a static labelled diagram of a floorplan or abstract space, use `hotspots` over an image. Requires Leaflet's stylesheet in the host app (`import \"leaflet/dist/leaflet.css\"`).",
  schema: z.object({
    center: z
      .tuple([z.number(), z.number()])
      .describe("Map center as [latitude, longitude]."),
    zoom: z
      .number()
      .optional()
      .describe("Zoom level (~1 world, ~12 city, ~18 street). Default 12."),
    markers: z.array(markerSchema).optional().describe("Pins to drop on the map."),
    height: z
      .string()
      .optional()
      .describe("CSS height of the map (Leaflet needs one). Default '24rem'."),
    scrollWheelZoom: z
      .boolean()
      .optional()
      .describe("Allow mouse-wheel zoom. Default false, so it never traps page scroll."),
    title: z.string().optional().describe("Accessible name for the map region."),
    caption: z.string().optional().describe("Optional caption below the map."),
  }),
  example: {
    type: "map",
    props: {
      center: [40.4168, -3.7038],
      zoom: 12,
      markers: [{ lat: 40.4168, lng: -3.7038, label: "Madrid" }],
      title: "Where the meetup happens",
      caption: "Central Madrid — the venue is a 5-minute walk from the metro.",
    },
  },
};
