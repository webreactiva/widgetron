import * as React from "react";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/primitives/tooltip";
import {
  InlineTermContext,
  RichText,
  type InlineTermRenderer,
} from "@/primitives/rich-text";

/** Term → definition map shared via context. */
export type GlossaryMap = Record<string, React.ReactNode>;

const GlossaryContext = React.createContext<GlossaryMap>({});

export interface GlossaryProviderProps {
  terms: GlossaryMap;
  children: React.ReactNode;
}

/**
 * Defines glossary terms once for everything underneath (e.g. a whole course).
 * Also teaches RichText to resolve `[[term]]` tokens, so a term works in ANY
 * author text slot (captions, checklist items, quiz feedback…), not just in
 * GlossaryText prose.
 */
export function GlossaryProvider({ terms, children }: GlossaryProviderProps) {
  const renderTerm = React.useCallback<InlineTermRenderer>(
    (name) => <GlossaryTerm term={name} name={name} />,
    [],
  );
  return (
    <GlossaryContext.Provider value={terms}>
      <InlineTermContext.Provider value={renderTerm}>
        {children}
      </InlineTermContext.Provider>
    </GlossaryContext.Provider>
  );
}

export function useGlossary(): GlossaryMap {
  return React.useContext(GlossaryContext);
}

export interface GlossaryTermProps {
  /** The visible term text. */
  term: React.ReactNode;
  /** Inline definition; if omitted, looked up in the GlossaryProvider. */
  definition?: React.ReactNode;
  /** Key to look up in the provider (defaults to `term` when it's a string). */
  name?: string;
  className?: string;
}

/**
 * GlossaryTerm — an inline term with a dotted underline that reveals its
 * definition in a tooltip (the signature dispensa reading affordance). The
 * definition can be inline or pulled from a GlossaryProvider. Falls back to
 * plain text when no definition is found.
 */
export function GlossaryTerm({
  term,
  definition,
  name,
  className,
}: GlossaryTermProps) {
  const glossary = useGlossary();
  const key = name ?? (typeof term === "string" ? term : undefined);
  const def = definition ?? (key != null ? glossary[key] : undefined);

  if (def == null) return <RichText>{term}</RichText>;

  return (
    <Tooltip content={<RichText>{def}</RichText>}>
      <button
        type="button"
        className={cn(
          "cursor-help font-medium text-foreground underline decoration-secondary decoration-dotted decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <RichText>{term}</RichText>
      </button>
    </Tooltip>
  );
}

GlossaryTerm.displayName = "GlossaryTerm";

export interface GlossaryTextProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Prose where `[[term]]` becomes a GlossaryTerm resolved from the provider. */
  text: string;
}

/**
 * GlossaryText — renders prose, turning every `[[term]]` into a GlossaryTerm
 * (resolved from the GlossaryProvider). The composable text primitive behind the
 * dispensa reading flow. `[[term]]` parsing itself lives in RichText, so terms
 * work in every text slot; this widget adds the paragraph chrome. Without a
 * provider, terms fall back to plain text — RichText strips the brackets, and
 * GlossaryTerm renders undefined-definition terms as prose.
 */
export function GlossaryText({ text, className, ...props }: GlossaryTextProps) {
  return (
    <p
      data-slot="glossary-text"
      className={cn("leading-relaxed text-foreground", className)}
      {...props}
    >
      <RichText>{text}</RichText>
    </p>
  );
}

GlossaryText.displayName = "GlossaryText";
