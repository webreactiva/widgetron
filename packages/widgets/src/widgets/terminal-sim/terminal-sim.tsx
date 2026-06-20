import * as React from "react";
import { Play, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface TerminalCommand {
  cmd: string;
  output?: string;
}

export interface TerminalSimLabels {
  run: React.ReactNode;
  done: React.ReactNode;
  reset: string;
  placeholder: React.ReactNode;
}

export const DEFAULT_TERMINAL_SIM_LABELS: TerminalSimLabels = {
  run: "Run next",
  done: "Done",
  reset: "Reset",
  placeholder: "Press “Run next” to launch the first command…",
};

export interface TerminalSimProps extends React.HTMLAttributes<HTMLDivElement> {
  commands: TerminalCommand[];
  windowTitle?: string;
  prompt?: string;
  /** Per-character typing speed in ms. Default: 28. */
  typingSpeedMs?: number;
  labels?: Partial<TerminalSimLabels>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * TerminalSim — a safe, simulated CLI. Commands "type themselves" and print
 * their output; the learner drives the pace, one command per click. Honors
 * `prefers-reduced-motion` (no typewriter animation). The body auto-scrolls.
 */
export function TerminalSim({
  commands,
  windowTitle = "terminal",
  prompt = "$",
  typingSpeedMs = 28,
  labels,
  className,
  ...props
}: TerminalSimProps) {
  const l = useLabels("terminalSim", DEFAULT_TERMINAL_SIM_LABELS, labels);
  const [rendered, setRendered] = React.useState<TerminalCommand[]>([]);
  const [typing, setTyping] = React.useState<{ cmd: string; shown: number } | null>(
    null,
  );
  const [index, setIndex] = React.useState(0);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const done = index >= commands.length;

  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [rendered, typing]);

  React.useEffect(() => {
    if (!typing) return;
    if (typing.shown >= typing.cmd.length) {
      const t = setTimeout(() => {
        setRendered((r) => [...r, { cmd: typing.cmd, output: commands[index]?.output }]);
        setIndex((i) => i + 1);
        setTyping(null);
      }, 250);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setTyping((tp) => (tp ? { ...tp, shown: tp.shown + 1 } : null)),
      typingSpeedMs,
    );
    return () => clearTimeout(t);
  }, [typing, typingSpeedMs, index, commands]);

  function runNext() {
    if (typing || done) return;
    const current = commands[index];
    if (prefersReducedMotion()) {
      setRendered((r) => [...r, { cmd: current.cmd, output: current.output }]);
      setIndex((i) => i + 1);
      return;
    }
    setTyping({ cmd: current.cmd, shown: 0 });
  }

  function reset() {
    if (typing) return;
    setRendered([]);
    setIndex(0);
    setTyping(null);
  }

  const empty = rendered.length === 0 && !typing;

  return (
    <div
      data-slot="terminal-sim"
      className={cn("overflow-hidden rounded-lg border shadow-wgt", className)}
      {...props}
    >
      <div className="flex items-center gap-2 border-b bg-muted px-4 py-2">
        <span className="size-3 rounded-full bg-destructive/70" />
        <span className="size-3 rounded-full bg-warning/70" />
        <span className="size-3 rounded-full bg-success/70" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          {windowTitle}
        </span>
      </div>

      <div
        ref={bodyRef}
        className="max-h-80 space-y-1 overflow-y-auto bg-[var(--wgt-code-bg)] p-4 font-mono text-sm text-[var(--wgt-code-fg)]"
      >
        {empty && (
          <div className="text-[var(--wgt-code-comment)]">{l.placeholder}</div>
        )}
        {rendered.map((line, i) => (
          <div key={i} className="motion-safe:animate-wgt-fade-up">
            <div>
              <span className="text-[var(--wgt-code-function)]">{prompt} </span>
              <span>{line.cmd}</span>
            </div>
            {line.output && (
              <div className="whitespace-pre-wrap text-[var(--wgt-code-fg)]/80">
                {line.output}
              </div>
            )}
          </div>
        ))}
        {typing && (
          <div>
            <span className="text-[var(--wgt-code-function)]">{prompt} </span>
            <span>{typing.cmd.slice(0, typing.shown)}</span>
            <span className="animate-pulse">▋</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t bg-card p-3">
        <Button onClick={runNext} disabled={done || typing !== null}>
          <Play />
          {done ? l.done : l.run}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={l.reset}
          onClick={reset}
          disabled={typing !== null}
        >
          <RotateCcw />
        </Button>
        <span className="ml-auto text-sm tabular-nums text-muted-foreground">
          {index} / {commands.length}
        </span>
      </div>
    </div>
  );
}

TerminalSim.displayName = "TerminalSim";
