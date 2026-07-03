// EXAMPLE widgetron widget skeleton (NOT copied from any repo — a recommended pattern
// distilled from shadcn/ui (CVA + cn + data-slot), the WAI-ARIA Disclosure pattern,
// Tailwind v4 container queries, and the responsive control-placement research).
//
// Demonstrates, in one file, every "house rule" for a widgetron widget:
//   - "use client" (interactive)
//   - CVA for variants, cn() to merge caller className
//   - SEMANTIC tokens only (bg-card, text-card-foreground, border-border, ring) — aseptic
//   - data-slot on every part (styling/test hook + theme targeting)
//   - WAI-ARIA Disclosure semantics for the flip (button + aria-expanded + aria-controls)
//   - @container + @max/@min container-query variants to reposition controls by SLOT width
//   - 44px (min-h-11/min-w-11) touch targets; focus-visible ring; safe-area padding
//   - prefers-reduced-motion handled in the registry item's `css` block (see registry.json)

"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const flashcardVariants = cva(
  // base: aseptic surface, all semantic tokens
  "@container/flashcard relative w-full rounded-[var(--radius)] border border-border bg-card text-card-foreground",
  {
    variants: {
      size: {
        sm: "min-h-40",
        default: "min-h-56",
        lg: "min-h-72",
      },
    },
    defaultVariants: { size: "default" },
  }
)

export interface FlashcardProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof flashcardVariants> {
  front: React.ReactNode
  back: React.ReactNode
  /** Controlled flip state (optional). */
  flipped?: boolean
  onFlippedChange?: (flipped: boolean) => void
}

function Flashcard({
  className,
  size,
  front,
  back,
  flipped: flippedProp,
  onFlippedChange,
  ...props
}: FlashcardProps) {
  const [internal, setInternal] = React.useState(false)
  const flipped = flippedProp ?? internal
  const panelId = React.useId()

  const toggle = () => {
    const next = !flipped
    onFlippedChange?.(next)
    if (flippedProp === undefined) setInternal(next)
  }

  return (
    <div
      data-slot="flashcard"
      data-flipped={flipped}
      className={cn(flashcardVariants({ size, className }))}
      {...props}
    >
      {/* Face content. Stacks vertically when narrow; controls move inline-right when the
          CONTAINER (not viewport) is wide. */}
      <div className="flex flex-col gap-4 p-4 @lg/flashcard:flex-row @lg/flashcard:items-center @lg/flashcard:justify-between">
        <div
          data-slot="flashcard-inner"
          id={panelId}
          className="flex-1"
          // The visible face; flip animation lives in the registry item css (animate-flip),
          // disabled under prefers-reduced-motion.
        >
          {flipped ? back : front}
        </div>

        {/* Controls. Disclosure button: aria-expanded + aria-controls.
            Narrow: bottom-anchored, full-reach, safe-area padded.
            Wide: compact, inline at the end. */}
        <div
          data-slot="flashcard-controls"
          className={cn(
            "flex items-center justify-end gap-2",
            "@max-lg/flashcard:sticky @max-lg/flashcard:bottom-0 @max-lg/flashcard:-mx-4 @max-lg/flashcard:border-t @max-lg/flashcard:border-border",
            "@max-lg/flashcard:bg-card/90 @max-lg/flashcard:px-4 @max-lg/flashcard:pt-3 @max-lg/flashcard:backdrop-blur",
            "@max-lg/flashcard:[padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]"
          )}
        >
          <button
            type="button"
            data-slot="flashcard-flip"
            aria-expanded={flipped}
            aria-controls={panelId}
            onClick={toggle}
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-4 text-sm font-medium",
              "bg-primary text-primary-foreground transition-colors hover:bg-primary/90",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "@max-lg/flashcard:flex-1"
            )}
          >
            {flipped ? "Show question" : "Show answer"}
          </button>
        </div>
      </div>
    </div>
  )
}

export { Flashcard, flashcardVariants }
