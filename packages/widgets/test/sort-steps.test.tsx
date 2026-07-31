import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SortSteps } from "@/widgets/sort-steps";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

const items = [
  { id: "a", label: "First" },
  { id: "b", label: "Second" },
  { id: "c", label: "Third" },
];

/** The rendered order, top to bottom. */
function currentOrder() {
  return screen
    .getAllByRole("listitem")
    .map((li) => li.textContent?.replace(/\s+/g, "") ?? "");
}

describe("SortSteps", () => {
  it("starts scrambled, deterministically", () => {
    const { unmount } = render(<SortSteps items={items} celebrate={false} />);
    const first = currentOrder();
    expect(first.join()).not.toBe("First,Second,Third");
    unmount();

    // Same input, same starting order — hydration would break otherwise.
    render(<SortSteps items={items} celebrate={false} />);
    expect(currentOrder()).toEqual(first);
  });

  it("reorders with the move buttons and grades the result", async () => {
    render(<SortSteps items={items} celebrate={false} />);

    // Walk each step up until the order matches the answer.
    for (let target = 0; target < items.length; target++) {
      for (;;) {
        const rows = screen.getAllByRole("listitem");
        const at = rows.findIndex((row) =>
          row.textContent?.includes(items[target].label),
        );
        if (at <= target) break;
        await userEvent.click(
          screen.getAllByRole("button", { name: "Move up" })[at],
        );
      }
    }

    await userEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(screen.getByText("That's the right order!")).toBeInTheDocument();
  });

  it("reports a wrong order without revealing the answer", async () => {
    render(<SortSteps items={items} celebrate={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Check order" }));
    expect(
      screen.getByText(/the highlighted steps are out of place/),
    ).toBeInTheDocument();
  });

  it("emits reordered and checked events", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<SortSteps items={items} celebrate={false} />);

    await userEvent.click(
      screen.getAllByRole("button", { name: "Move down" })[0],
    );
    await userEvent.click(screen.getByRole("button", { name: "Check order" }));

    expect(received.map((d) => d.action).slice(0, 2)).toEqual([
      "reordered",
      "checked",
    ]);
    expect(received[0]).toMatchObject({
      widget: "sort-steps",
      data: { from: 0, to: 1 },
    });
    expect(received[1].data).toHaveProperty("correct");
    off();
  });
});
