import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tabs } from "@/widgets/tabs";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

const items = [
  { label: "pnpm", content: "pnpm add zod" },
  { label: "npm", content: "npm install zod" },
  { label: "yarn", content: "yarn add zod" },
];

describe("Tabs", () => {
  it("opens the default tab and switches on click", async () => {
    render(<Tabs items={items} />);

    const [pnpm, npm] = screen.getAllByRole("tab");
    expect(pnpm).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("npm install zod").closest("[role=tabpanel]"))
      .toHaveAttribute("hidden");

    await userEvent.click(npm);
    expect(npm).toHaveAttribute("aria-selected", "true");
    expect(pnpm).toHaveAttribute("aria-selected", "false");
    expect(
      screen.getByText("npm install zod").closest("[role=tabpanel]"),
    ).not.toHaveAttribute("hidden");
  });

  it("honors defaultIndex and clamps it to the range", () => {
    const { unmount } = render(<Tabs items={items} defaultIndex={2} />);
    expect(screen.getAllByRole("tab")[2]).toHaveAttribute(
      "aria-selected",
      "true",
    );
    unmount();

    render(<Tabs items={items} defaultIndex={99} />);
    expect(screen.getAllByRole("tab")[2]).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves between tabs with the arrow keys, wrapping around", async () => {
    render(<Tabs items={items} />);
    const tabs = screen.getAllByRole("tab");

    tabs[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(tabs[2]).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
  });

  it("keeps only the active tab tabbable", () => {
    render(<Tabs items={items} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
  });

  it("emits tab_changed with the new index", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<Tabs items={items} />);

    await userEvent.click(screen.getAllByRole("tab")[1]);

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "tabs",
      action: "tab_changed",
      data: { index: 1 },
    });
    off();
  });
});
