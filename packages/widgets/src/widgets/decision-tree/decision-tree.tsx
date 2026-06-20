import * as React from "react";
import { ChevronRight, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface DecisionOption {
  /** The choice text shown on the button. */
  label: React.ReactNode;
  /** Id of the node this choice leads to. */
  to: string;
}

export interface DecisionNode {
  /** The question / prompt shown for this node. */
  prompt: React.ReactNode;
  /** Branch choices. A node with `options` is a question. */
  options?: DecisionOption[];
  /** Terminal result. A node with `outcome` and no `options` is a leaf. */
  outcome?: React.ReactNode;
}

export interface DecisionTreeLabels {
  /** Label for the control that resets the tree to its start node. */
  restart: React.ReactNode;
}

export const DEFAULT_DECISION_TREE_LABELS: DecisionTreeLabels = {
  restart: "Start over",
};

export interface DecisionTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Id of the first node to show. */
  start: string;
  /** All nodes in the tree, keyed by id. */
  nodes: Record<string, DecisionNode>;
  /** Customizable / translatable strings. */
  labels?: Partial<DecisionTreeLabels>;
}

/**
 * DecisionTree — a branching "choose-your-own-path" explorable. The reader
 * makes a choice, follows a branch, and lands on an outcome. Mobile-first:
 * choices are full-width, thumb-sized tap targets stacked vertically; the
 * "Start over" control sits within thumb reach on the outcome panel. The
 * changing prompt/outcome region is an aria-live region so each step is
 * announced. All copy is customizable/translatable via `labels` (or globally
 * through WidgetronProvider).
 */
export function DecisionTree({
  start,
  nodes,
  labels,
  className,
  ...props
}: DecisionTreeProps) {
  const l = useLabels("decisionTree", DEFAULT_DECISION_TREE_LABELS, labels);
  const [current, setCurrent] = React.useState<string>(start);
  const [path, setPath] = React.useState<React.ReactNode[]>([]);

  const node = nodes[current];

  function choose(option: DecisionOption) {
    setPath((p) => [...p, option.label]);
    setCurrent(option.to);
  }

  function restart() {
    setCurrent(start);
    setPath([]);
  }

  if (node == null) return null;

  const isLeaf = node.outcome != null && !node.options;

  return (
    <div
      data-slot="decision-tree"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {path.length > 0 && (
        <nav
          aria-label="Your path"
          className="mb-4 flex flex-wrap items-center gap-1.5"
        >
          {path.map((label, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )}
              <span className="rounded-full border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] px-2.5 py-0.5 text-xs font-medium text-foreground">
                {label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div aria-live="polite" className="motion-safe:animate-wgt-fade-up">
        <p className="font-display font-semibold leading-snug">{node.prompt}</p>

        {node.options ? (
          <div className="mt-4 flex flex-col gap-2">
            {node.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => choose(option)}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-left text-sm transition-colors",
                  "cursor-pointer hover:border-ring hover:bg-accent",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                )}
              >
                <span className="flex-1">{option.label}</span>
                <ChevronRight
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
            ))}
          </div>
        ) : isLeaf ? (
          <div className="mt-4 rounded-md border border-primary bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))] p-3 text-sm text-card-foreground/90">
            {node.outcome}
          </div>
        ) : null}
      </div>

      {isLeaf && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw />
            {l.restart}
          </Button>
        </div>
      )}
    </div>
  );
}

DecisionTree.displayName = "DecisionTree";
