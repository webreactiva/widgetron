import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Reflection } from "@/widgets/reflection";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

const ANSWER = "We swallow errors in the fetch wrapper.";

describe("Reflection", () => {
  beforeEach(() => window.localStorage.clear());

  it("holds the model answer back until the reader commits", async () => {
    render(
      <Reflection
        id="r1"
        prompt="Where does it happen?"
        modelAnswer="Usually in catch blocks."
        celebrate={false}
      />,
    );

    expect(screen.queryByText("Usually in catch blocks.")).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox"), ANSWER);
    await userEvent.click(
      screen.getByRole("button", { name: "Save my answer" }),
    );

    expect(screen.getByText("Usually in catch blocks.")).toBeInTheDocument();
  });

  it("keeps saving disabled until the answer is long enough", async () => {
    render(<Reflection id="r2" prompt="P?" minLength={10} celebrate={false} />);
    const save = screen.getByRole("button", { name: "Save my answer" });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "too short");
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), " enough now");
    expect(save).toBeEnabled();
  });

  it("restores the answer on a later visit, already committed", async () => {
    const { unmount } = render(
      <Reflection id="r3" prompt="P?" celebrate={false} />,
    );
    await userEvent.type(screen.getByRole("textbox"), ANSWER);
    await userEvent.click(
      screen.getByRole("button", { name: "Save my answer" }),
    );
    expect(window.localStorage.getItem("widgetron-reflection:r3")).toBe(ANSWER);
    unmount();

    render(<Reflection id="r3" prompt="P?" celebrate={false} />);
    expect(screen.getByRole("textbox")).toHaveValue(ANSWER);
    expect(screen.getByRole("button", { name: /Answer saved/ })).toBeDisabled();
  });

  it("emits the answer's length, never its text", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<Reflection id="r4" prompt="P?" celebrate={false} />);

    await userEvent.type(screen.getByRole("textbox"), ANSWER);
    await userEvent.click(
      screen.getByRole("button", { name: "Save my answer" }),
    );

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "reflection",
      action: "saved",
      id: "r4",
      data: { length: ANSWER.length },
    });
    expect(JSON.stringify(received[0])).not.toContain("swallow");
    off();
  });

  it("does not persist when persist is false", async () => {
    render(<Reflection id="r5" prompt="P?" persist={false} celebrate={false} />);
    await userEvent.type(screen.getByRole("textbox"), ANSWER);
    await userEvent.click(
      screen.getByRole("button", { name: "Save my answer" }),
    );
    expect(window.localStorage.getItem("widgetron-reflection:r5")).toBeNull();
  });
});
