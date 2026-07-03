/**
 * SRT utilities: parse a .srt transcript into AudioClip cues (seconds),
 * cut a time range out (rebased for a clipped MP3), and apply known ASR
 * fixes ("gazapos") as plain text replacements.
 */

export interface Cue {
  start: number;
  end?: number;
  text: string;
}

const TIME_RE =
  /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/;

/** "01:02:03,450" → seconds. */
export function parseTimestamp(value: string): number {
  const m = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!m) throw new Error(`Invalid SRT timestamp: "${value}"`);
  const [, h, min, s, ms] = m;
  return (
    Number(h) * 3600 + Number(min) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000
  );
}

/** Parse SRT text into cues. Tolerates missing index lines and \r\n. */
export function parseSrt(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    let i = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines.length > 1) i = 1;
    const time = lines[i]?.match(TIME_RE);
    if (!time) continue;
    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = time;
    const start =
      Number(h1) * 3600 + Number(m1) * 60 + Number(s1) + Number(ms1.padEnd(3, "0")) / 1000;
    const end =
      Number(h2) * 3600 + Number(m2) * 60 + Number(s2) + Number(ms2.padEnd(3, "0")) / 1000;
    const textLines = lines.slice(i + 1).join(" ").replace(/<[^>]+>/g, "").trim();
    if (textLines === "") continue;
    cues.push({ start, end, text: textLines });
  }
  return cues;
}

export interface CutOptions {
  /** Shift times so the range starts at 0 (for a clipped MP3). Default: true. */
  rebase?: boolean;
}

/** Keep the cues that overlap [from, to] (seconds), optionally rebased. */
export function cutRange(
  cues: Cue[],
  from: number,
  to: number,
  { rebase = true }: CutOptions = {},
): Cue[] {
  return cues
    .filter((c) => (c.end ?? c.start) > from && c.start < to)
    .map((c) => {
      if (!rebase) return { ...c };
      const start = Math.max(0, c.start - from);
      const end = c.end === undefined ? undefined : Math.max(start, c.end - from);
      return { ...c, start, end };
    });
}

/** Apply known ASR-error replacements to every cue (literal, all occurrences). */
export function applyFixes(cues: Cue[], fixes: Record<string, string>): Cue[] {
  return cues.map((c) => {
    let text = c.text;
    for (const [wrong, right] of Object.entries(fixes)) {
      text = text.split(wrong).join(right);
    }
    return { ...c, text };
  });
}
