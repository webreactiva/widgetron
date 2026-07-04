import * as React from "react";
import { ArrowRight } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export interface FlowNodeDetail {
  title?: React.ReactNode;
  description: React.ReactNode;
}

export interface FlowNode {
  label: React.ReactNode;
  /** Highlight this node as the focal point of the flow. */
  active?: boolean;
  /** When present, the node becomes clickable and reveals this panel. */
  detail?: FlowNodeDetail;
}

export interface FlowDiagramLabels {
  hint: React.ReactNode;
}

export const DEFAULT_FLOW_DIAGRAM_LABELS: FlowDiagramLabels = {
  hint: "Select a step to see what happens there.",
};

export interface FlowDiagramProps extends React.HTMLAttributes<HTMLDivElement> {
  nodes: FlowNode[];
  /** Custom separator between nodes. Defaults to an arrow icon. */
  separator?: React.ReactNode;
  /** Pre-select a node index (only meaningful when nodes have details). */
  defaultSelected?: number;
  labels?: Partial<FlowDiagramLabels>;
}

/**
 * FlowDiagram — a linear "A → B → C" flow. When nodes carry a `detail`, they
 * become an interactive walkthrough: clicking a step opens an information panel
 * explaining what happens there (arrow keys move between steps). Without
 * details it renders as a plain static flow. The panel is an aria-live region.
 */
export function FlowDiagram({
  nodes,
  separator,
  defaultSelected,
  labels,
  className,
  ...props
}: FlowDiagramProps) {
  const l = useLabels("flowDiagram", DEFAULT_FLOW_DIAGRAM_LABELS, labels);
  const hasDetails = nodes.some((n) => n.detail);
  const [selected, setSelected] = React.useState<number | null>(
    defaultSelected ?? null,
  );
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const detailIndexes = nodes
    .map((n, i) => (n.detail ? i : -1))
    .filter((i) => i >= 0);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const pos = detailIndexes.indexOf(index);
    if (pos === -1) return;
    e.preventDefault();
    const nextPos =
      e.key === "ArrowRight"
        ? (pos + 1) % detailIndexes.length
        : (pos - 1 + detailIndexes.length) % detailIndexes.length;
    const target = detailIndexes[nextPos];
    btnRefs.current[target]?.focus();
    setSelected(target);
  }

  const selectedNode = selected !== null ? nodes[selected] : null;

  return (
    <div
      data-slot="flow-diagram"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
        {nodes.map((node, index) => {
          const isSelected = selected === index;
          const nodeClass = cn(
            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : node.active
                ? "border-primary bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))] text-foreground"
                : "border-border bg-card text-card-foreground",
          );
          return (
            <React.Fragment key={index}>
              {node.detail ? (
                <button
                  type="button"
                  ref={(el) => {
                    btnRefs.current[index] = el;
                  }}
                  aria-pressed={isSelected}
                  aria-expanded={isSelected}
                  onClick={() =>
                    setSelected((s) => (s === index ? null : index))
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={cn(
                    nodeClass,
                    "cursor-pointer outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <RichText>{node.label}</RichText>
                </button>
              ) : (
                <span className={nodeClass}>
                  <RichText>{node.label}</RichText>
                </span>
              )}
              {index < nodes.length - 1 && (
                <span aria-hidden className="text-muted-foreground">
                  {separator ?? <ArrowRight className="size-4" />}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {hasDetails && (
        <div aria-live="polite">
          {selectedNode?.detail ? (
            <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-wgt">
              {selectedNode.detail.title != null && (
                <p className="font-display font-semibold leading-tight">
                  <RichText>{selectedNode.detail.title}</RichText>
                </p>
              )}
              <div
                className={cn(
                  "text-sm text-muted-foreground",
                  selectedNode.detail.title != null && "mt-1",
                )}
              >
                <RichText>{selectedNode.detail.description}</RichText>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {l.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

FlowDiagram.displayName = "FlowDiagram";
