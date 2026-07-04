import * as React from "react";
import { AlertTriangle, Info, Lightbulb } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export type CalloutVariant = "aha" | "info" | "warning";

export interface CalloutBoxLabels {
  aha: React.ReactNode;
  info: React.ReactNode;
  warning: React.ReactNode;
}

export const DEFAULT_CALLOUT_BOX_LABELS: CalloutBoxLabels = {
  aha: "Aha",
  info: "Info",
  warning: "Careful",
};

export interface CalloutBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual intent. `aha` = insight, `info` = context, `warning` = caution. */
  variant?: CalloutVariant;
  /** Override the uppercase label for this instance. Defaults per variant. */
  label?: React.ReactNode;
  /** Show the leading icon. Default: true. */
  icon?: boolean;
  /** Customizable / translatable per-variant default labels. */
  labels?: Partial<CalloutBoxLabels>;
}

const ACCENT: Record<CalloutVariant, string> = {
  aha: "var(--wgt-callout-aha)",
  info: "var(--wgt-callout-info)",
  warning: "var(--wgt-callout-warning)",
};

const ICON: Record<CalloutVariant, React.ComponentType<{ className?: string }>> = {
  aha: Lightbulb,
  info: Info,
  warning: AlertTriangle,
};

/**
 * CalloutBox — highlights a piece of information with an intent. Brand-agnostic:
 * its accent comes from the `--wgt-callout-*` tokens, so it picks up the active
 * theme (neutral by default, terracotta/lilac/mustard under Web Reactiva).
 */
export function CalloutBox({
  variant = "aha",
  label,
  icon = true,
  labels,
  className,
  children,
  style,
  ...props
}: CalloutBoxProps) {
  const l = useLabels("calloutBox", DEFAULT_CALLOUT_BOX_LABELS, labels);
  const Icon = ICON[variant];
  return (
    <div
      data-slot="callout"
      data-variant={variant}
      role="note"
      className={cn(
        "rounded-lg border border-l-4 p-4 text-sm leading-relaxed motion-safe:animate-wgt-fade-up",
        "border-l-[var(--callout)] bg-[color-mix(in_oklab,var(--callout)_7%,var(--card))] text-card-foreground",
        className,
      )}
      style={{ ["--callout" as string]: ACCENT[variant], ...style }}
      {...props}
    >
      <div className="mb-1.5 flex items-center gap-2 text-[var(--callout)]">
        {icon && <Icon className="size-4 shrink-0" />}
        <span className="text-xs font-bold uppercase tracking-wide">
          {label ?? l[variant]}
        </span>
      </div>
      <div className="text-card-foreground/90 [&_a]:font-medium [&_a]:text-[var(--callout)] [&_a]:underline">
        <RichText>{children}</RichText>
      </div>
    </div>
  );
}

CalloutBox.displayName = "CalloutBox";
