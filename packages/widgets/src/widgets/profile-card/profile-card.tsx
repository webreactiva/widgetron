import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface ProfileCardPerson {
  name: string;
  /** Avatar image URL. Falls back to initials when omitted or on load error. */
  avatar?: string;
  /** Initials override; default: derived from the name (max 2). */
  initials?: string;
  /** Short reference line under the name — role, show, company. */
  role?: React.ReactNode;
  /** Bio blurb. */
  bio?: React.ReactNode;
  /** Optional link (personal site, profile) — wraps the name. */
  href?: string;
}

export interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  people: ProfileCardPerson[];
  /**
   * "grid" (default) stacks vertical cards into container-aware columns —
   * right for teams and guest lineups. "list" keeps one horizontal card per
   * row — right for one person or few people with longer bios.
   */
  layout?: "grid" | "list";
}

function initialsOf(person: ProfileCardPerson): string {
  if (person.initials) return person.initials.slice(0, 3).toUpperCase();
  return person.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!)
    .join("")
    .toUpperCase();
}

function Avatar({
  person,
  index,
  className,
}: {
  person: ProfileCardPerson;
  index: number;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  const accent = `var(--chart-${(index % 5) + 1})`;
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-display font-bold",
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${accent} 18%, transparent)`,
        color: accent,
      }}
    >
      {person.avatar && !broken ? (
        <img
          src={person.avatar}
          alt=""
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initialsOf(person)
      )}
    </span>
  );
}

function Name({ person }: { person: ProfileCardPerson }) {
  const name = (
    <span className="font-display font-semibold leading-tight">
      <RichText>{person.name}</RichText>
    </span>
  );
  if (!person.href) return name;
  return (
    <a
      href={person.href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
    >
      {name}
    </a>
  );
}

/**
 * ProfileCard — people cards: avatar (image, or auto-initials on a per-person
 * accent), name, role line and bio. One person renders a single card; several
 * stack into container-aware columns ("grid") or stay one per row ("list").
 * Aseptic: accents come from the `--chart-*` theme tokens.
 */
export function ProfileCard({
  people,
  layout = "grid",
  className,
  ...props
}: ProfileCardProps) {
  const grid = layout === "grid" && people.length > 1;
  return (
    <div
      data-slot="profile-card"
      className={cn("@container/pc", className)}
      {...props}
    >
      <ul
        className={cn(
          "grid list-none grid-cols-1 gap-4 p-0",
          grid && "@md/pc:grid-cols-2 @2xl/pc:grid-cols-3",
        )}
      >
        {people.map((person, i) => (
          <li
            key={i}
            className={cn(
              "rounded-lg border bg-card p-5 text-card-foreground shadow-wgt motion-safe:animate-wgt-fade-up",
              grid
                ? "flex flex-col items-center gap-3 text-center"
                : "flex items-start gap-4",
            )}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <Avatar
              person={person}
              index={i}
              className={grid ? "size-16 text-xl" : "size-14 text-lg"}
            />
            <div className={cn("min-w-0", grid && "flex flex-col items-center")}>
              <Name person={person} />
              {person.role != null && (
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <RichText>{person.role}</RichText>
                </p>
              )}
              {person.bio != null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  <RichText>{person.bio}</RichText>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

ProfileCard.displayName = "ProfileCard";
