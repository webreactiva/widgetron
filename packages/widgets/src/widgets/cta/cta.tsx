import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { ArrowRight, Check } from "@/lib/icons";
import { RichText } from "@/primitives/rich-text";

export type CtaVariant = "link" | "email-form";

export interface CtaLabels {
  /** Placeholder inside the email input. */
  emailPlaceholder: React.ReactNode;
  /** Accessible label for the email input. */
  emailLabel: React.ReactNode;
  /** Privacy-consent checkbox copy (linked when `privacyUrl` is set). */
  privacyConsent: React.ReactNode;
  /** Submit button (idle). */
  submit: React.ReactNode;
  /** Submit button while the request is in flight. */
  sending: React.ReactNode;
  /** Message shown after a successful submit. */
  success: React.ReactNode;
  /** Message shown after a failed submit. */
  error: React.ReactNode;
}

export const DEFAULT_CTA_LABELS: CtaLabels = {
  emailPlaceholder: "you@example.com",
  emailLabel: "Your email",
  privacyConsent: "I accept the privacy policy",
  submit: "Sign up",
  sending: "Sending…",
  success: "Done — check your inbox.",
  error: "Something went wrong. Please try again.",
};

export interface CtaProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Which call-to-action to render. */
  variant: CtaVariant;
  /** Headline of the call-to-action. */
  title: React.ReactNode;
  /** Optional supporting line under the title. */
  description?: React.ReactNode;
  /** Author copy for the link button (link variant). */
  buttonLabel?: string;
  /** Destination for the `link` variant (opens in a new tab). */
  url?: string;
  /** Privacy-policy URL — turns the consent label into a link (email-form). */
  privacyUrl?: string;
  /** Endpoint the `email-form` variant POSTs `{ email }` to as JSON. */
  submitEndpoint?: string;
  /** Customizable / translatable strings. */
  labels?: Partial<CtaLabels>;
}

type SubmitStatus = "idle" | "sending" | "success" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cta — the single conversion moment of a guide (usually its last screen).
 * Presentational: it renders gracefully when optional props are missing (no
 * `url` → disabled button; no `submitEndpoint` → disabled submit) and does not
 * enforce which props each variant requires. `link` sends the reader to an
 * external destination; `email-form` captures an address behind a required
 * privacy-consent checkbox and POSTs it as JSON.
 */
export function Cta({
  variant,
  title,
  description,
  buttonLabel,
  url,
  privacyUrl,
  submitEndpoint,
  labels,
  className,
  ...props
}: CtaProps) {
  const l = useLabels("cta", DEFAULT_CTA_LABELS, labels);
  const { ref, emit } = useWidgetEvents("cta");
  const emailId = React.useId();
  const consentId = React.useId();

  const [email, setEmail] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [status, setStatus] = React.useState<SubmitStatus>("idle");

  const emailValid = EMAIL_PATTERN.test(email);
  const canSubmit =
    emailValid && consent && status !== "sending" && Boolean(submitEndpoint);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !submitEndpoint) return;
    setStatus("sending");
    try {
      const res = await fetch(submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      emit("submitted", { ok: true });
    } catch {
      setStatus("error");
      emit("submitted", { ok: false });
    }
  }

  return (
    <div
      ref={ref}
      data-slot="cta"
      data-variant={variant}
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="text-lg font-semibold tracking-tight text-foreground">
        <RichText>{title}</RichText>
      </div>
      {description != null && (
        <div className="mt-1 text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
          <RichText>{description}</RichText>
        </div>
      )}

      {variant === "link" ? (
        <div className="mt-4">
          {url ? (
            <Button asChild className="max-w-full flex-wrap whitespace-normal break-words">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => emit("clicked", { variant: "link", url })}
              >
                <RichText>{buttonLabel ?? l.submit}</RichText>
                <ArrowRight />
              </a>
            </Button>
          ) : (
            <Button disabled className="max-w-full flex-wrap whitespace-normal break-words">
              <RichText>{buttonLabel ?? l.submit}</RichText>
            </Button>
          )}
        </div>
      ) : status === "success" ? (
        <p
          data-slot="cta-success"
          role="status"
          className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--success)] motion-safe:animate-wgt-fade-up"
        >
          <Check className="size-4 shrink-0" />
          {l.success}
        </p>
      ) : (
        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-sm font-medium">
              {l.emailLabel}
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                typeof l.emailPlaceholder === "string"
                  ? l.emailPlaceholder
                  : undefined
              }
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id={consentId}
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <label htmlFor={consentId} className="text-sm text-muted-foreground">
              {privacyUrl ? (
                <a
                  href={privacyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline"
                >
                  {l.privacyConsent}
                </a>
              ) : (
                l.privacyConsent
              )}
            </label>
          </div>

          {status === "error" && (
            <p
              data-slot="cta-error"
              role="alert"
              className="text-sm font-medium text-destructive"
            >
              {l.error}
            </p>
          )}

          <Button type="submit" disabled={!canSubmit}>
            {status === "sending" ? l.sending : l.submit}
          </Button>
        </form>
      )}
    </div>
  );
}

Cta.displayName = "Cta";
