import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checklist } from "@/widgets/checklist";
import {
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

const items = [{ text: "First task" }, { text: "Second task" }];

describe("Checklist", () => {
  beforeEach(() => window.localStorage.clear());

  it("toggles items and persists across remounts", async () => {
    const { unmount } = render(<Checklist id="t1" items={items} />);

    const first = screen.getByRole("checkbox", { name: /First task/ });
    expect(first).toHaveAttribute("aria-checked", "false");

    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-checked", "true");
    expect(window.localStorage.getItem("widgetron-checklist:t1")).toContain("0");

    unmount();
    render(<Checklist id="t1" items={items} />);
    expect(
      screen.getByRole("checkbox", { name: /First task/ }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("emits item_toggled events and completed exactly once", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<Checklist id="t3" items={items} celebrate={false} />);

    const first = screen.getByRole("checkbox", { name: /First task/ });
    const second = screen.getByRole("checkbox", { name: /Second task/ });

    await userEvent.click(first);
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "checklist",
      action: "item_toggled",
      id: "t3",
      data: { index: 0, checked: true, completed: 1, total: 2 },
    });

    await userEvent.click(second);
    const completed = received.filter((d) => d.action === "completed");
    expect(completed).toHaveLength(1);
    expect(completed[0].data).toEqual({ total: 2 });

    // Uncheck + recheck the last item: more toggles, but no second "completed".
    await userEvent.click(second);
    await userEvent.click(second);
    expect(received.filter((d) => d.action === "item_toggled")).toHaveLength(4);
    expect(received.filter((d) => d.action === "completed")).toHaveLength(1);
    off();
  });

  it("does not persist when persist is false", async () => {
    render(<Checklist id="t2" items={items} persist={false} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /First task/ }));
    expect(window.localStorage.getItem("widgetron-checklist:t2")).toBeNull();
  });
});
