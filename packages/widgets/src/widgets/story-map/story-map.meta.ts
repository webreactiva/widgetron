import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

const markerSchema = z.object({
  lat: z.number().describe("Latitude."),
  lng: z.number().describe("Longitude."),
  label: z.string().optional().describe("Short plain-text popup label."),
});

export const storyMapMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "A guided map tour: the map pins to the pane and flies from stop to stop as short prose cards scroll over it.",
  whenToUse:
    "Use to narrate something that moves across places — a journey, the spread of a trend, the sites of a story, a company's expansion — where each beat has a location and the camera should travel between them. 2–5 stops; each names a center, zoom and markers. Prefer a single `map` when there is one place, not a route; prefer `backdrop-section` when the sticky scene is an image or the episode's words rather than geography. At most one per guide — it hijacks the scroll like any pinned scene. Requires Leaflet's stylesheet in the host app (`import \"leaflet/dist/leaflet.css\"`).",
  schema: z.object({
    steps: z
      .array(
        z.object({
          content: z.string().describe("The prose card that scrolls over the map."),
          center: z
            .tuple([z.number(), z.number()])
            .describe("Where the map flies when this step activates, [lat, lng]."),
          zoom: z.number().optional().describe("Zoom for this step. Default 12."),
          markers: z
            .array(markerSchema)
            .optional()
            .describe("Pins shown while this step is active."),
        }),
      )
      .min(1)
      .describe("2–5 stops is the sweet spot."),
  }),
  example: {
    type: "story-map",
    props: {
      steps: [
        {
          content:
            "It started in a **Madrid** flat — one developer, one newsletter, no plan.",
          center: [40.4168, -3.7038],
          zoom: 11,
          markers: [{ lat: 40.4168, lng: -3.7038, label: "Where it began" }],
        },
        {
          content:
            "Within a year the audience had spread across **Barcelona** and the coast.",
          center: [41.3874, 2.1686],
          zoom: 11,
          markers: [{ lat: 41.3874, lng: 2.1686, label: "Barcelona" }],
        },
        {
          content: "Today the community reaches the whole Spanish-speaking web.",
          center: [40.0, -4.0],
          zoom: 5,
        },
      ],
    },
  },
};
