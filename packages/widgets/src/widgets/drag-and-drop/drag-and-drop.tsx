import * as React from "react";
import { Check, GripVertical, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { fireConfetti } from "@/lib/confetti";
import { RichText, plainRich } from "@/primitives/rich-text";

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
  /** Hint shown inside an empty zone once a chip is picked up. */
  dropHere: React.ReactNode;
  /** Eyebrow over the explanation panel. */
  why: React.ReactNode;
}

export const DEFAULT_DRAG_AND_DROP_LABELS: DragAndDropLabels = {
  check: "Check",
  correct: "All correct!",
  incorrect: "Some don't match yet — try again.",
  reset: "Reset",
  instructions: "Tap an item, then tap its match — or drag it.",
  dropHere: "Drop here",
  why: "What separates them",
};

export interface DragAndDropProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The chips to categorize; each carries the id of its correct target. */
  items: DragItem[];
  /** The drop zones items get placed into. */
  targets: DropTarget[];
  /**
   * The rule that separates the zones, shown after checking — the payoff. A
   * board that turns green and says nothing has tested the reader's sorting
   * and taught them no criterion to sort by next time.
   */
  explanation?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<DragAndDropLabels>;
  /** Fire confetti the moment the board becomes fully correct. Default: true. */
  celebrate?: boolean;
}

type ChipStatus = "idle" | "selected" | "correct" | "wrong";

/** Shared tile shell: a physical, grabbable chip. */
const TILE_BASE =
  "group/chip inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium " +
  "transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out " +
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

/** Grabbable tile at rest: resting shadow, lifts on hover, presses on active. */
const TILE_IDLE =
  "cursor-grab border-input bg-background shadow-wgt hover:border-ring hover:bg-accent hover:shadow-wgt-hover " +
  "motion-safe:hover:-translate-y-0.5 active:cursor-grabbing motion-safe:active:translate-y-0 active:shadow-wgt " +
  "motion-reduce:transform-none";

/**
 * DragAndDrop — categorize/match archetype: place each item into its correct
 * zone. Touch- and keyboard-friendly by design: CLICK-TO-PLACE is the primary
 * interaction (tap a chip to select it, then tap a zone to drop it there; tap a
 * placed chip to send it back to the pool). Native HTML5 drag is layered on top
 * as a progressive enhancement and never required. Mobile-first: chips and zones
 * are large tap targets and the layout stacks.
 *
 * Tactile by design: chips read as physical tiles (grip handle, resting shadow,
 * a lift on hover and a press on active, a "picked-up" state when selected), and
 * an armed zone tints toward the accent + invites a drop — so the affordance is
 * visible, not guessed. All copy is customizable / translatable via `labels`.
 */
export function DragAndDrop({
  items,
  targets,
  explanation,
  labels,
  celebrate = true,
  className,
  ...props
}: DragAndDropProps) {
  const l = useLabels("dragAndDrop", DEFAULT_DRAG_AND_DROP_LABELS, labels);
  const { ref, emit } = useWidgetEvents("drag-and-drop");

  const [placement, setPlacement] = React.useState<Record<string, string | null>>(
    () => {
      const initial: Record<string, string | null> = {};
      for (const item of items) initial[item.id] = null;
      return initial;
    },
  );
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);
  /** Zone currently under a native drag, for a live drop-target highlight. */
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  /** Source chip for a native drag-in-progress (progressive enhancement only). */
  const dragItemId = React.useRef<string | null>(null);
  const completedRef = React.useRef(false);

  const allPlaced = items.every((item) => placement[item.id] != null);
  const allCorrect = items.every((item) => placement[item.id] === item.target);
  const armed = selected != null;

  function place(itemId: string, targetId: string | null) {
    const next = { ...placement, [itemId]: targetId };
    setPlacement(next);
    setSelected(null);
    const nowCorrect = items.every((item) => next[item.id] === item.target);
    if (nowCorrect) {
      setChecked(true);
      if (!completedRef.current) {
        completedRef.current = true;
        emit("completed", { items: items.length });
        if (celebrate) void fireConfetti();
      }
    } else {
      completedRef.current = false;
      setChecked(false);
    }
  }

  function handleCheck() {
    setChecked(true);
    emit("checked", { correct: allCorrect });
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
    setDragOver(null);
  }

  function handleZoneDrop(
    event: React.DragEvent<HTMLButtonElement>,
    targetId: string,
  ) {
    event.preventDefault();
    setDragOver(null);
    const itemId =
      event.dataTransfer.getData("text/plain") || dragItemId.current;
    dragItemId.current = null;
    if (!itemId || !(itemId in placement)) return;
    place(itemId, targetId);
  }

  const poolItems = items.filter((item) => placement[item.id] == null);

  return (
    <div
      ref={ref}
      data-slot="drag-and-drop"
      data-checked={checked || undefined}
      data-armed={armed || undefined}
      className={cn(
        "@container/dnd rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="text-sm text-muted-foreground">
        <RichText>{l.instructions}</RichText>
      </p>

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
              TILE_BASE,
              selected === item.id
                ? "-translate-y-0.5 cursor-grabbing border-primary bg-accent text-accent-foreground shadow-wgt-hover ring-2 ring-primary motion-safe:animate-wgt-pop motion-reduce:transform-none"
                : TILE_IDLE,
            )}
          >
            <GripVertical
              className={cn(
                "size-3.5 shrink-0 transition-colors",
                selected === item.id
                  ? "text-primary"
                  : "text-muted-foreground/50 group-hover/chip:text-muted-foreground",
              )}
            />
            <RichText>{item.label}</RichText>
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
          const isOver = dragOver === target.id;
          return (
            <button
              key={target.id}
              type="button"
              // An aria-label is a string, so the markers have to go: a zone
              // called `**Safe to cache**` is otherwise announced with them.
              aria-label={plainRich(target.label) || undefined}
              data-armed={armed || undefined}
              data-over={isOver || undefined}
              onClick={() => handleZoneClick(target.id)}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={() => setDragOver(target.id)}
              onDragLeave={(event) => {
                // Ignore leaves into child elements of the same zone.
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragOver((prev) => (prev === target.id ? null : prev));
                }
              }}
              onDrop={(event) => handleZoneDrop(event, target.id)}
              className={cn(
                "flex min-h-24 w-full flex-col gap-2 rounded-lg border-2 p-3 text-left",
                "transition-[transform,border-color,background-color,box-shadow] duration-150 ease-out",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isOver
                  ? "scale-[1.01] cursor-copy border-solid border-primary bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] shadow-wgt-hover ring-2 ring-primary/30 motion-reduce:transform-none"
                  : armed
                    ? "cursor-pointer border-dashed border-primary/50 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))]"
                    : "cursor-default border-dashed border-input",
              )}
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RichText>{target.label}</RichText>
                {placedItems.length > 0 && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold leading-none tabular-nums text-muted-foreground">
                    {placedItems.length}
                  </span>
                )}
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
                        TILE_BASE,
                        status === "idle" && TILE_IDLE,
                        status === "correct" &&
                          "border-success bg-[color-mix(in_oklab,var(--success)_14%,var(--card))] text-foreground shadow-wgt",
                        status === "wrong" &&
                          "border-destructive bg-[color-mix(in_oklab,var(--destructive)_14%,var(--card))] text-foreground shadow-wgt motion-safe:animate-wgt-shake",
                      )}
                    >
                      {status === "correct" ? (
                        <Check className="size-3.5 shrink-0 text-success" />
                      ) : status === "wrong" ? (
                        <X className="size-3.5 shrink-0 text-destructive" />
                      ) : (
                        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover/chip:text-muted-foreground" />
                      )}
                      <RichText>{item.label}</RichText>
                    </span>
                  );
                })}
                {placedItems.length === 0 && (
                  <span
                    className={cn(
                      "pointer-events-none flex min-h-9 items-center rounded-md border border-dashed px-3 text-xs transition-colors",
                      armed
                        ? "border-primary/40 text-primary/80"
                        : "border-transparent text-transparent",
                    )}
                  >
                    <RichText>{l.dropHere}</RichText>
                  </span>
                )}
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

      {checked && explanation != null && (
        <div className="mt-3 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-info">
            {l.why}
          </p>
          <div className="text-card-foreground/90">
            <RichText>{explanation}</RichText>
          </div>
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
            setDragOver(null);
          }}
        >
          <RotateCcw />
          {l.reset}
        </Button>
        <Button size="sm" disabled={!allPlaced} onClick={handleCheck}>
          {l.check}
        </Button>
      </div>
    </div>
  );
}

DragAndDrop.displayName = "DragAndDrop";
