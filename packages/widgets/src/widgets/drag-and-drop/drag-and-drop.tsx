import * as React from "react";
import { Check, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface DragItem {
  /** Unique id for this item. */
  id: string;
  /** The chip label shown to the learner. */
  label: React.ReactNode;
  /** Id of the DropTarget this item belongs in. */
  target: string;
}

export interface DropTarget {
  /** Unique id for this zone (referenced by `DragItem.target`). */
  id: string;
  /** The zone heading / accessible name. */
  label: React.ReactNode;
}

export interface DragAndDropLabels {
  check: React.ReactNode;
  correct: React.ReactNode;
  incorrect: React.ReactNode;
  reset: React.ReactNode;
  instructions: React.ReactNode;
}

export const DEFAULT_DRAG_AND_DROP_LABELS: DragAndDropLabels = {
  check: "Check",
  correct: "All correct!",
  incorrect: "Some don't match yet — try again.",
  reset: "Reset",
  instructions: "Tap an item, then tap its match — or drag it.",
};

export interface DragAndDropProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The chips to categorize; each carries the id of its correct target. */
  items: DragItem[];
  /** The drop zones items get placed into. */
  targets: DropTarget[];
  /** Customizable / translatable strings. */
  labels?: Partial<DragAndDropLabels>;
}

type ChipStatus = "idle" | "selected" | "correct" | "wrong";

/**
 * DragAndDrop — categorize/match archetype: place each item into its correct
 * zone. Touch- and keyboard-friendly by design: CLICK-TO-PLACE is the primary
 * interaction (tap a chip to select it, then tap a zone to drop it there; tap a
 * placed chip to send it back to the pool). Native HTML5 drag is layered on top
 * as a progressive enhancement and never required. Mobile-first: chips and zones
 * are large tap targets and the layout stacks. All copy is customizable /
 * translatable via `labels` (or globally through WidgetronProvider).
 */
export function DragAndDrop({
  items,
  targets,
  labels,
  className,
  ...props
}: DragAndDropProps) {
  const l = useLabels("dragAndDrop", DEFAULT_DRAG_AND_DROP_LABELS, labels);

  const [placement, setPlacement] = React.useState<Record<string, string | null>>(
    () => {
      const initial: Record<string, string | null> = {};
      for (const item of items) initial[item.id] = null;
      return initial;
    },
  );
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);

  /** Source chip for a native drag-in-progress (progressive enhancement only). */
  const dragItemId = React.useRef<string | null>(null);

  const allPlaced = items.every((item) => placement[item.id] != null);
  const allCorrect = items.every((item) => placement[item.id] === item.target);

  function place(itemId: string, targetId: string | null) {
    setPlacement((prev) => ({ ...prev, [itemId]: targetId }));
    setSelected(null);
    // Changing placement after checking re-arms the feedback.
    setChecked(false);
  }

  function handleChipClick(itemId: string) {
    setChecked(false);
    setSelected((prev) => (prev === itemId ? null : itemId));
  }

  function handlePlacedChipClick(itemId: string) {
    // Tapping a placed chip returns it to the pool.
    place(itemId, null);
  }

  function handleZoneClick(targetId: string) {
    if (selected == null) return;
    place(selected, targetId);
  }

  function handleDragStart(
    event: React.DragEvent<HTMLButtonElement>,
    itemId: string,
  ) {
    dragItemId.current = itemId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragEnd() {
    dragItemId.current = null;
  }

  function handleZoneDrop(
    event: React.DragEvent<HTMLButtonElement>,
    targetId: string,
  ) {
    event.preventDefault();
    const itemId =
      event.dataTransfer.getData("text/plain") || dragItemId.current;
    dragItemId.current = null;
    if (!itemId || !(itemId in placement)) return;
    place(itemId, targetId);
  }

  const poolItems = items.filter((item) => placement[item.id] == null);

  return (
    <div
      data-slot="drag-and-drop"
      data-checked={checked || undefined}
      className={cn(
        "@container/dnd rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="text-sm text-muted-foreground">{l.instructions}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {poolItems.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            aria-pressed={selected === item.id}
            onClick={() => handleChipClick(item.id)}
            onDragStart={(event) => handleDragStart(event, item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "cursor-pointer rounded-md border px-3 py-2 font-mono text-sm transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              selected === item.id
                ? "border-ring bg-accent text-accent-foreground ring-2 ring-primary"
                : "border-input bg-background hover:border-ring hover:bg-accent",
            )}
          >
            {item.label}
          </button>
        ))}
        {poolItems.length === 0 && (
          <span className="px-1 py-2 text-sm text-muted-foreground/70">
            &nbsp;
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-3 @md/dnd:grid-cols-2">
        {targets.map((target) => {
          const placedItems = items.filter(
            (item) => placement[item.id] === target.id,
          );
          return (
            <button
              key={target.id}
              type="button"
              aria-label={
                typeof target.label === "string" ? target.label : undefined
              }
              onClick={() => handleZoneClick(target.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleZoneDrop(event, target.id)}
              className={cn(
                "flex min-h-24 w-full flex-col gap-2 rounded-md border-2 border-dashed p-3 text-left transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                selected != null
                  ? "cursor-pointer border-ring bg-accent/40"
                  : "cursor-default border-input",
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {target.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {placedItems.map((item) => {
                  const status: ChipStatus = checked
                    ? placement[item.id] === item.target
                      ? "correct"
                      : "wrong"
                    : "idle";
                  return (
                    <span
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      aria-pressed={false}
                      onClick={(event) => {
                        event.stopPropagation();
                        handlePlacedChipClick(item.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          handlePlacedChipClick(item.id);
                        }
                      }}
                      onDragStart={(event) =>
                        handleDragStart(
                          event as unknown as React.DragEvent<HTMLButtonElement>,
                          item.id,
                        )
                      }
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 font-mono text-sm transition-colors",
                        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        status === "idle" &&
                          "border-input bg-background hover:border-ring hover:bg-accent",
                        status === "correct" &&
                          "border-success bg-[color-mix(in_oklab,var(--success)_12%,var(--card))] text-foreground",
                        status === "wrong" &&
                          "border-destructive bg-[color-mix(in_oklab,var(--destructive)_12%,var(--card))] text-foreground",
                      )}
                    >
                      {status === "correct" && (
                        <Check className="size-3.5 text-success" />
                      )}
                      {status === "wrong" && (
                        <X className="size-3.5 text-destructive" />
                      )}
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {checked && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-md border p-3 text-sm font-semibold motion-safe:animate-wgt-fade-up",
            allCorrect
              ? "border-success/40 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))]"
              : "border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))]",
          )}
        >
          {allCorrect ? l.correct : l.incorrect}
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const cleared: Record<string, string | null> = {};
            for (const item of items) cleared[item.id] = null;
            setPlacement(cleared);
            setSelected(null);
            setChecked(false);
          }}
        >
          <RotateCcw />
          {l.reset}
        </Button>
        <Button
          size="sm"
          disabled={!allPlaced}
          onClick={() => setChecked(true)}
        >
          {l.check}
        </Button>
      </div>
    </div>
  );
}

DragAndDrop.displayName = "DragAndDrop";
