import * as React from "react";
import { Play, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";

export interface LabVariant {
  /** What this variant IS — "As shipped", "Fixed", "Strategy B". */
  label: React.ReactNode;
  /** The JavaScript to run. Author-written; the reader cannot edit it. */
  code: string;
  /** One line on what to watch for. Shown under the label. */
  note?: React.ReactNode;
}

export interface CodeLabLabels {
  /** The run control. */
  run: React.ReactNode;
  /** The re-run control, once a variant has output. */
  rerun: React.ReactNode;
  /** Shown in the output pane while the variant is running. */
  running: React.ReactNode;
  /** Eyebrow over the output pane. */
  output: React.ReactNode;
  /** Placeholder before a variant has been run. */
  idle: React.ReactNode;
  /** Shown when a run produced no console output at all. */
  silent: React.ReactNode;
  /** Shown when a run exceeded the time budget and was stopped. */
  timedOut: React.ReactNode;
}

export const DEFAULT_CODE_LAB_LABELS: CodeLabLabels = {
  run: "Run",
  rerun: "Run again",
  running: "Running…",
  output: "Output",
  idle: "Run it and see.",
  silent: "Ran clean — and printed nothing.",
  timedOut: "Stopped: this variant ran longer than the time budget.",
};

type LineKind = "log" | "info" | "warn" | "error";

interface OutputLine {
  kind: LineKind;
  text: string;
}

interface RunState {
  lines: OutputLine[];
  running: boolean;
  timedOut?: boolean;
  /**
   * Whether Run was ever pressed. Derived state cannot answer this: a variant
   * that completes having printed nothing has no lines, is not running and did
   * not time out, so inferring it from those three said "never run" and the
   * reader was shown the pre-run prompt for a run that had already finished.
   */
  ran?: boolean;
}

export interface CodeLabProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The fixed variants to run and compare. Two or three is the useful range. */
  variants: LabVariant[];
  /** Shared preamble prepended to every variant (helpers, fixtures, stubs). */
  setup?: string;
  /** The question the comparison answers. */
  question?: React.ReactNode;
  /** How long a single run may take, in ms, before it is stopped. Default: 5000. */
  timeout?: number;
  /** Customizable / translatable strings. */
  labels?: Partial<CodeLabLabels>;
}

/** Message shape the sandbox posts back. */
interface LabMessage {
  __widgetronLab: 1;
  kind: LineKind | "done";
  text?: string;
}

function isLabMessage(value: unknown): value is LabMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __widgetronLab?: unknown }).__widgetronLab === 1
  );
}

/**
 * The runner injected into each sandboxed frame. It patches `console`, runs the
 * author's code inside an async IIFE (so top-level `await` works), and posts
 * every line back to the parent. `</script` is neutralized so a code sample
 * containing one cannot close the tag it lives in.
 */
function buildDocument(setup: string, code: string, nonce: number): string {
  // The author's code travels as a JSON STRING, not as inlined source, for two
  // reasons. It cannot break out of the tag it lives in (with `<` escaped, a
  // `</script>` in a code sample is just characters). And compiling it through
  // the AsyncFunction constructor turns a syntax error into a catchable
  // exception — inlined, it would kill the whole script before the console
  // patch was installed, and the reader would sit through the full time budget
  // and be told the run "timed out".
  const source = JSON.stringify(`${setup}\n;\n${code}`).replace(/</g, "\\u003c");
  return `<!doctype html><meta charset="utf-8"><!--${nonce}--><script>
(function () {
  var send = function (kind, text) {
    try { parent.postMessage({ __widgetronLab: 1, kind: kind, text: text }, "*"); } catch (e) {}
  };
  var seen;
  var fmt = function (v) {
    if (typeof v === "string") return v;
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "function") return "[Function" + (v.name ? ": " + v.name : "") + "]";
    if (v instanceof Error) return v.name + ": " + v.message;
    if (v === undefined) return "undefined";
    try {
      seen = new WeakSet();
      return JSON.stringify(v, function (k, val) {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        if (typeof val === "bigint") return String(val) + "n";
        if (typeof val === "function") return "[Function]";
        return val;
      }, 2);
    } catch (e) { return String(v); }
  };
  var line = function (kind) {
    return function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) parts.push(fmt(arguments[i]));
      send(kind, parts.join(" "));
    };
  };
  console.log = line("log");
  console.info = line("info");
  console.warn = line("warn");
  console.error = line("error");
  console.debug = line("log");
  window.onerror = function (m) { send("error", String(m)); return true; };
  window.onunhandledrejection = function (e) {
    send("error", "Unhandled rejection: " + fmt(e.reason));
  };
  var done = function () { send("done"); };
  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  var result = null;
  try {
    // Compiling and calling are separate steps on purpose: a SyntaxError lands
    // here, with the message the author needs, instead of silently.
    result = new AsyncFunction(${source})();
  } catch (e) {
    send("error", fmt(e));
    done();
  }
  if (result) {
    Promise.resolve(result).then(
      function () { setTimeout(done, 150); },
      function (e) { send("error", fmt(e)); setTimeout(done, 0); }
    );
  }
})();
</script>`;
}

const EMPTY: RunState = { lines: [], running: false };

/**
 * CodeLab — run the author's fixed variants and watch them differ.
 *
 * The reader cannot edit the code; they press Run. That constraint is the
 * point. A mechanism the reader *operates* — a buggy function executed beside
 * its fix, two strategies over the same input — lands harder than the same
 * mechanism animated in a diagram, because the output is produced in front of
 * them rather than asserted by the author. When the source contains something
 * that can be executed faithfully in a few lines, reach for this before
 * reaching for another diagram.
 *
 * Each variant runs in its own sandboxed iframe (`allow-scripts` only): no
 * same-origin access, no DOM, no cookies, no network credentials, and a hard
 * time budget that stops runaway loops. Variants never share state — comparing
 * two runs is only honest if the second one starts clean.
 *
 * Siblings: PredictOutput asks what the code prints and reveals a fixed answer;
 * CodeLab actually runs it. TerminalSim replays canned CLI output with nothing
 * executing at all. Scrubber and TangleText explore a formula, not code.
 */
export function CodeLab({
  variants,
  setup = "",
  question,
  timeout = 5000,
  labels,
  className,
  ...props
}: CodeLabProps) {
  const l = useLabels("codeLab", DEFAULT_CODE_LAB_LABELS, labels);
  const { ref, emit } = useWidgetEvents("code-lab");

  const [docs, setDocs] = React.useState<Record<number, string>>({});
  const [runs, setRuns] = React.useState<Record<number, RunState>>({});
  const frames = React.useRef<Array<HTMLIFrameElement | null>>([]);
  const timers = React.useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  // Only messages from one of THIS widget's own frames are accepted; the frames
  // are sandboxed without allow-same-origin, so identity is the source window,
  // not the origin (which is "null" for every one of them).
  //
  // Listening on the DOCUMENT THAT OWNS the frames, not on `window`, is
  // load-bearing. A host may portal a widget into another document — the
  // playground renders every demo inside a device-frame iframe — and then the
  // component's code still runs in the parent realm while its DOM lives in the
  // frame's. The sandbox posts to `parent`, which is the owning document's
  // view; a listener on `window` is in a different realm and never hears it.
  // That failure is silent: the run stays on "Running…" forever.
  React.useEffect(() => {
    const view = ref.current?.ownerDocument?.defaultView ?? window;

    function onMessage(event: MessageEvent) {
      const index = frames.current.findIndex(
        (frame) => frame != null && event.source === frame.contentWindow,
      );
      if (index < 0 || !isLabMessage(event.data)) return;
      const message = event.data;
      setRuns((prev) => {
        const current = prev[index] ?? EMPTY;
        if (message.kind === "done") {
          return { ...prev, [index]: { ...current, running: false } };
        }
        return {
          ...prev,
          [index]: {
            ...current,
            lines: [
              ...current.lines,
              { kind: message.kind, text: message.text ?? "" },
            ],
          },
        };
      });
      if (message.kind === "done") {
        clearTimeout(timers.current[index]);
        delete timers.current[index];
      }
    }
    view.addEventListener("message", onMessage);
    return () => view.removeEventListener("message", onMessage);
  }, [ref]);

  React.useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of Object.values(pending)) clearTimeout(id);
    };
  }, []);

  function run(index: number) {
    const variant = variants[index];
    if (!variant) return;
    clearTimeout(timers.current[index]);
    setRuns((prev) => ({
      ...prev,
      [index]: { lines: [], running: true, ran: true },
    }));
    setDocs((prev) => ({
      ...prev,
      [index]: buildDocument(setup, variant.code, Date.now()),
    }));
    // Blanking the frame's document is what actually stops a runaway loop —
    // there is no other way to interrupt script in a frame we don't own.
    timers.current[index] = setTimeout(() => {
      setDocs((prev) => ({ ...prev, [index]: "" }));
      setRuns((prev) => ({
        ...prev,
        [index]: { ...(prev[index] ?? EMPTY), running: false, timedOut: true },
      }));
      delete timers.current[index];
    }, timeout);
    emit("variant_run", { index });
  }

  return (
    <div
      ref={ref}
      data-slot="code-lab"
      className={cn(
        "@container/lab rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      {question != null && (
        <p className="mb-4 font-display text-lg font-semibold leading-snug @md/lab:text-xl">
          <RichText>{question}</RichText>
        </p>
      )}

      <div className="grid gap-4 @2xl/lab:grid-cols-2">
        {variants.map((variant, index) => {
          const state = runs[index] ?? EMPTY;
          const hasRun = Boolean(state.ran);
          return (
            <div
              key={index}
              data-slot="code-lab-variant"
              className="flex flex-col overflow-hidden rounded-md border"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    <RichText>{variant.label}</RichText>
                  </p>
                  {variant.note != null && (
                    <p className="text-xs text-muted-foreground">
                      <RichText>{variant.note}</RichText>
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={hasRun ? "outline" : "default"}
                  disabled={state.running}
                  onClick={() => run(index)}
                >
                  {hasRun ? <RotateCcw /> : <Play />}
                  {hasRun ? l.rerun : l.run}
                </Button>
              </div>

              <pre className="overflow-x-auto bg-[var(--wgt-code-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--wgt-code-fg)]">
                <code>{variant.code}</code>
              </pre>

              <div className="flex min-h-24 flex-col border-t">
                <p className="border-b px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  {l.output}
                </p>
                <div
                  role="status"
                  aria-live="polite"
                  className="flex-1 overflow-x-auto p-3 font-mono text-xs leading-relaxed"
                >
                  {state.running && (
                    <p className="text-muted-foreground">{l.running}</p>
                  )}
                  {state.lines.map((line, i) => (
                    <p
                      key={i}
                      data-kind={line.kind}
                      className={cn(
                        "whitespace-pre-wrap",
                        line.kind === "error" && "text-destructive",
                        line.kind === "warn" && "text-warning",
                        line.kind === "info" && "text-info",
                      )}
                    >
                      {line.text}
                    </p>
                  ))}
                  {state.timedOut && (
                    <p className="text-destructive">{l.timedOut}</p>
                  )}
                  {!state.running &&
                    !state.timedOut &&
                    state.lines.length === 0 && (
                      <p className="text-muted-foreground">
                        {hasRun ? l.silent : l.idle}
                      </p>
                    )}
                </div>
              </div>

              <iframe
                ref={(node) => {
                  frames.current[index] = node;
                }}
                title=""
                aria-hidden
                tabIndex={-1}
                sandbox="allow-scripts"
                referrerPolicy="no-referrer"
                srcDoc={docs[index] ?? ""}
                className="hidden"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

CodeLab.displayName = "CodeLab";
