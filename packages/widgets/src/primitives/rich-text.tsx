import * as React from "react";

/**
 * RichText — the library's markdown-agnostic text layer.
 *
 * Widgets accept authored copy as `React.ReactNode`, but the JSON generation
 * surface can only send **strings**. So a string like `"**foo** and `bar`"`
 * would otherwise render with its literal markers. `RichText` closes that gap:
 * pass any node through it and
 *
 * - a **string** is parsed for a safe inline-markdown subset — `**bold**`,
 *   `*italic*`, `` `code` ``, `[text](url)` links — with `\n` becoming a soft
 *   line break;
 * - anything **else** (a nested widget element, an array of mixed
 *   children, a number…) passes through untouched.
 *
 * That keeps every widget agnostic: it never has to know whether it received a
 * plain string, marked-up copy, or a real React subtree. Styling stays with the
 * host — the emitted `<strong>/<em>/<code>/<a>` inherit the parent's `[&_a]`,
 * `[&_code]`… rules — so this primitive is brand-agnostic like everything else.
 *
 * Dependency-free by design (mirrors `lib/icons`): a tiny hand-rolled parser,
 * no markdown package, and it builds real React elements (never
 * `dangerouslySetInnerHTML`), so authored copy can't inject markup.
 */

// One pass finds the next inline token. Order matters: bold (`**`) before
// italic (`*`) so `**` is never read as two emphases; links and code before
// italic so `*`/`_` inside a URL or code span are left alone. Emphasis requires
// a non-space right inside the markers, so prose like "2 * 3" is never italic.
const INLINE =
  /\*\*(\S(?:[\s\S]*?\S)?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*(\S(?:[\s\S]*?\S)?)\*/;

/** Allow only safe link targets; returns null for anything script-like. */
function safeHref(raw: string): string | null {
  const h = raw.trim();
  if (/^(https?:|mailto:|tel:)/i.test(h)) return h;
  if (/^[/#]/.test(h)) return h; // root-relative or anchor
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h)) return `mailto:${h}`; // bare email
  if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return null; // unknown scheme (e.g. javascript:)
  return h; // plain relative path
}

const isHttp = (href: string): boolean => /^https?:/i.test(href);

/** Split on newlines, interleaving `<br />` for soft line breaks. */
function withBreaks(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  text.split("\n").forEach((line, i) => {
    if (i > 0) out.push(<br key={`${key}-br${i}`} />);
    if (line) out.push(line);
  });
  return out;
}

function parseInline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length > 0) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(...withBreaks(rest, `${key}.${i}`));
      break;
    }
    if (m.index > 0) {
      out.push(...withBreaks(rest.slice(0, m.index), `${key}.${i}t`));
    }
    const k = `${key}.${i}m`;
    if (m[1] != null) {
      out.push(<strong key={k}>{parseInline(m[1], k)}</strong>);
    } else if (m[2] != null) {
      const href = safeHref(m[3]);
      out.push(
        href ? (
          <a
            key={k}
            href={href}
            {...(isHttp(href)
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {parseInline(m[2], k)}
          </a>
        ) : (
          <React.Fragment key={k}>{parseInline(m[2], k)}</React.Fragment>
        ),
      );
    } else if (m[4] != null) {
      out.push(<code key={k}>{m[4]}</code>);
    } else if (m[5] != null) {
      out.push(<em key={k}>{parseInline(m[5], k)}</em>);
    }
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  return out;
}

/**
 * Format a node: parse inline markdown when it is a string, recurse into
 * arrays, and pass every other node type through unchanged. Exposed for callers
 * that build their own elements (e.g. an SVG-external legend).
 */
export function renderRich(value: React.ReactNode): React.ReactNode {
  if (typeof value === "string") return <>{parseInline(value, "r")}</>;
  if (Array.isArray(value)) {
    return value.map((v, i) => (
      <React.Fragment key={i}>{renderRich(v)}</React.Fragment>
    ));
  }
  return value;
}

export interface RichTextProps {
  children?: React.ReactNode;
}

/**
 * Drop-in wrapper: `<RichText>{copy}</RichText>` formats string copy and leaves
 * nodes alone. Renders no wrapper element of its own.
 */
export function RichText({ children }: RichTextProps): React.ReactElement {
  return <>{renderRich(children)}</>;
}

RichText.displayName = "RichText";
