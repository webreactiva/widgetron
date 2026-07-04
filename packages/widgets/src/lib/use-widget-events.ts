import * as React from "react";

import { emitWidgetronEvent } from "@/lib/analytics";

/**
 * Internal helper for widgets that emit semantic analytics events: attach
 * `ref` to the widget's root element and call `emit(action, data)` inside
 * user-triggered handlers (never in effects — that keeps emissions immune to
 * hydration and Strict Mode double-invocation). Events dispatch from the root
 * so hosts can attribute them via bubbling (e.g. closest storyline section).
 */
export function useWidgetEvents(widget: string, id?: string) {
  const ref = React.useRef<HTMLDivElement>(null);
  const emit = React.useCallback(
    (action: string, data?: Record<string, unknown>) =>
      emitWidgetronEvent(ref.current, {
        source: "widget",
        widget,
        action,
        id,
        data,
      }),
    [widget, id],
  );
  return { ref, emit };
}
