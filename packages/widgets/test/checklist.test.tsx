import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Checklist } from "@/widgets/checklist";

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

  it("does not persist when persist is false", async () => {
    render(<Checklist id="t2" items={items} persist={false} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /First task/ }));
    expect(window.localStorage.getItem("widgetron-checklist:t2")).toBeNull();
  });
});
