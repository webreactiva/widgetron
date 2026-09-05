import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText, plainRich } from "@/primitives/rich-text";

export interface GraphNode {
  /** Unique id, referenced by edges. */
  id: string;
  /** The box label. */
  label: React.ReactNode;
  /** Second line inside the box — what this thing is. */
  note?: React.ReactNode;
  /** 1-based grid row. Omit to let the flow wrap naturally. */
  row?: number;
  /** 1-based grid column. Omit to let the flow wrap naturally. */
  col?: number;
  /** Draw attention to this node. */
  active?: boolean;
  /** Subdue it — present, but not what this beat is about. */
  muted?: boolean;
  /** When present the node becomes clickable and reveals this panel. */
  detail?: React.ReactNode;
}

export interface GraphEdge {
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** What travels along it — "GET /product/42", "SELECT …". */
  label?: React.ReactNode;
  /** Draw it dashed: an optional, failing or fallback path. */
  dashed?: boolean;
  /** Draw attention to this edge. */
  active?: boolean;
}

export interface NodeGraphLabels {
  /** Instruction shown when nodes carry details. */
  hint: React.ReactNode;
  /** Accessible heading for the text description of the graph. */
  structure: string;
  /** Screen-reader sentence for one edge: from → to (label). */
  edge: (from: string, to: string, label: string) => string;
}

export const DEFAULT_NODE_GRAPH_LABELS: NodeGraphLabels = {
  hint: "Select a node to see what it does.",
  structure: "What connects to what",
  edge: (from, to, label) =>
    label ? `${from} → ${to}: ${label}` : `${from} → ${to}`,
};

export interface NodeGraphProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The boxes. */
  nodes: GraphNode[];
  /** The arrows between them. Any node may connect to any other. */
  edges: GraphEdge[];
  /** Grid columns. Default: min(nodes.length, 3). */
  cols?: number;
  /** A line under the graph — what it is a picture of. */
  caption?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<NodeGraphLabels>;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DrawnEdge {
  key: string;
  d: string;
  /** Midpoint of the curve, where the label chip sits. */
  lx: number;
  ly: number;
  edge: GraphEdge;
}

/** Where an edge leaves/enters a box, and the curve between the two. */
function curve(a: Box, b: Box) {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  // Leave through the face that actually points at the other box, so an edge
  // never crosses its own node.
  const vertical = Math.abs(bcy - acy) > Math.abs(bcx - acx);
  const down = bcy > acy;
  const right = bcx > acx;
  const p1 = vertical
    ? { x: acx, y: down ? a.y + a.h : a.y }
    : { x: right ? a.x + a.w : a.x, y: acy };
  const p2 = vertical
    ? { x: bcx, y: down ? b.y : b.y + b.h }
    : { x: right ? b.x : b.x + b.w, y: bcy };
  const c1 = vertical
    ? { x: p1.x, y: (p1.y + p2.y) / 2 }
    : { x: (p1.x + p2.x) / 2, y: p1.y };
  const c2 = vertical
    ? { x: p2.x, y: (p1.y + p2.y) / 2 }
    : { x: (p1.x + p2.x) / 2, y: p2.y };
  return {
    d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
    // Cubic Bézier at t = 0.5 — (P0 + 3·C1 + 3·C2 + P3) / 8. Cheaper and more
    // predictable than mounting the path just to call getPointAtLength.
    lx: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8,
    ly: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8,
  };
}

/**
 * NodeGraph — boxes in HTML, arrows in SVG.
 *
 * The hybrid is the whole point. A diagram drawn entirely in SVG (what Mermaid
 * produces) puts its labels inside `<text>`, and SVG cannot render HTML — so
 * those labels lose `RichText`: no `**bold**`, no `` `code` ``, no `[[glossary]]`
 * tooltips, no links, no theme typography, and no reflow when a translation
 * runs longer than the original. A diagram drawn entirely in HTML can't draw a
 * diagonal arrow at all, which is why FlowDiagram is a straight line.
 *
 * So the nodes stay real HTML on a CSS grid — themed, container-aware,
 * translatable, focusable, rich text and all — and only the geometry that joins
 * them is SVG, computed from the boxes' measured positions after layout. A
 * change in wording moves the boxes and the arrows follow; nothing to keep in
 * sync by hand. Edge labels are HTML chips positioned on the curve rather than
 * SVG `<text>`, so they keep RichText too.
 *
 * The structure is also written out as a visually-hidden list, server-rendered.
 * The arrows are geometry and geometry needs measurement, which needs a
 * browser — so a reader on a screen reader, or before hydration, still gets
 * what connects to what.
 *
 * Siblings: FlowDiagram for a straight A → B → C with no real edges;
 * MermaidDiagram when the graph is big enough that hand-placing it is the wrong
 * job and losing rich labels is an acceptable trade.
 */
export function NodeGraph({
  nodes,
  edges,
  cols,
  caption,
  labels,
  className,
  ...props
}: NodeGraphProps) {
  const l = useLabels("nodeGraph", DEFAULT_NODE_GRAPH_LABELS, labels);
  const { ref, emit } = useWidgetEvents("node-graph");
  // Marker ids are document-global, so two graphs on one page would share an
  // arrowhead — and the second one would silently win.
  const arrowId = `wgt-arrow-${React.useId().replace(/:/g, "")}`;

  const frameRef = React.useRef<HTMLDivElement>(null);
  const boxRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [drawn, setDrawn] = React.useState<DrawnEdge[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);

  const columns = cols ?? Math.min(nodes.length, 3);

  // Measure after layout, and again whenever the container or any box resizes:
  // a container query, a font swap or a longer translation all move the boxes,
  // and the arrows have to follow.
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;

    const draw = () => {
      const origin = frame.getBoundingClientRect();
      const boxOf = (id: string): Box | null => {
        const el = boxRefs.current[id];
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: r.left - origin.left,
          y: r.top - origin.top,
          w: r.width,
          h: r.height,
        };
      };
      setDrawn(
        edges.flatMap((edge, i) => {
          const a = boxOf(edge.from);
          const b = boxOf(edge.to);
          if (!a || !b) return [];
          return [{ key: `${edge.from}->${edge.to}-${i}`, ...curve(a, b), edge }];
        }),
      );
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(frame);
    for (const el of Object.values(boxRefs.current)) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [nodes, edges]);

  const hasDetails = nodes.some((n) => n.detail);
  const selectedNode = nodes.find((n) => n.id === selected) ?? null;
  // The description is read aloud, so the markdown markers have to go — an
  // unflattened `**API**` is announced as "star star API star star".
  const labelOf = (id: string) =>
    plainRich(nodes.find((n) => n.id === id)?.label, id);

  function pick(id: string) {
    const next = selected === id ? null : id;
    setSelected(next);
    if (next) emit("node_inspected", { id: next });
  }

  return (
    <div
      ref={ref}
      data-slot="node-graph"
      className={cn("@container/graph flex flex-col gap-3", className)}
      {...props}
    >
      {hasDetails && (
        <p className="text-xs text-muted-foreground">
          <RichText>{l.hint}</RichText>
        </p>
      )}

      <div ref={frameRef} className="relative">
        {/* Geometry only. Decorative: the same structure is written out below. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full overflow-visible text-muted-foreground/70"
        >
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
            </marker>
          </defs>
          {drawn.map((e) => (
            <path
              key={e.key}
              data-slot="node-graph-edge"
              d={e.d}
              fill="none"
              strokeWidth={e.edge.active ? 2.5 : 1.5}
              strokeDasharray={e.edge.dashed ? "5 4" : undefined}
              markerEnd={`url(#${arrowId})`}
              className={e.edge.active ? "text-primary" : undefined}
              stroke="currentColor"
            />
          ))}
        </svg>

        {/* The boxes: real HTML, so they keep RichText, theme and reflow. */}
        <div
          className="relative grid gap-x-6 gap-y-8"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {nodes.map((node) => {
            const isSelected = selected === node.id;
            const content = (
              <>
                <span className="block text-sm font-medium">
                  <RichText>{node.label}</RichText>
                </span>
                {node.note != null && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    <RichText>{node.note}</RichText>
                  </span>
                )}
              </>
            );
            const shared = cn(
              "block rounded-md border p-2.5 text-center transition-colors",
              isSelected || node.active
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))]"
                : "border-input bg-card",
              node.muted && !isSelected && "opacity-55",
            );
            return (
              <div
                key={node.id}
                ref={(el) => {
                  boxRefs.current[node.id] = el;
                }}
                style={{ gridRow: node.row, gridColumn: node.col }}
                className="min-w-0"
              >
                {node.detail != null ? (
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => pick(node.id)}
                    className={cn(
                      shared,
                      "w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      !isSelected && "hover:border-ring hover:bg-accent",
                    )}
                  >
                    {content}
                  </button>
                ) : (
                  <div className={shared}>{content}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Edge labels as HTML chips on the curve — SVG <text> would lose
            RichText, which is the whole reason this widget exists. */}
        {drawn.map((e) =>
          e.edge.label == null ? null : (
            <span
              key={`${e.key}-label`}
              className={cn(
                "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded border bg-card px-1.5 py-0.5 text-[0.7rem] leading-tight",
                e.edge.active
                  ? "border-primary/50 text-foreground"
                  : "border-input text-muted-foreground",
              )}
              style={{ left: e.lx, top: e.ly }}
            >
              <RichText>{e.edge.label}</RichText>
            </span>
          ),
        )}
      </div>

      {/* Server-rendered, so the structure survives with no JS and no sight. */}
      <div className="sr-only">
        <h4>{l.structure}</h4>
        <ul>
          {edges.map((edge, i) => (
            <li key={i}>
              {l.edge(labelOf(edge.from), labelOf(edge.to), plainRich(edge.label))}
            </li>
          ))}
        </ul>
      </div>

      {selectedNode?.detail != null && (
        <div
          role="status"
          className="rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up"
        >
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-info">
            <RichText>{selectedNode.label}</RichText>
          </p>
          <div className="text-card-foreground/90">
            <RichText>{selectedNode.detail}</RichText>
          </div>
        </div>
      )}

      {caption != null && (
        <p className="text-xs text-muted-foreground">
          <RichText>{caption}</RichText>
        </p>
      )}
    </div>
  );
}

NodeGraph.displayName = "NodeGraph";
