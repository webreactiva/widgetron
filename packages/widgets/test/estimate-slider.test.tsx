import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EstimateSlider } from "@/widgets/estimate-slider";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

function setup(props: Partial<React.ComponentProps<typeof EstimateSlider>> = {}) {
  return render(
    <EstimateSlider
      question="How many?"
      min={0}
      max={100}
      answer={30}
      tolerance={10}
      celebrate={false}
      reveal="Because most of the week is not typing."
      {...props}
    />,
  );
}

describe("EstimateSlider", () => {
  it("hides the answer until the reader commits", async () => {
    setup();
    expect(screen.queryByText("The real number")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Lock in my guess" }),
    );

    expect(screen.getByText("The real number")).toBeInTheDocument();
    expect(
      screen.getByText("Because most of the week is not typing."),
    ).toBeInTheDocument();
  });

  it("celebrates a close guess and measures a far one", async () => {
    setup();
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "35" } });
    await userEvent.click(
      screen.getByRole("button", { name: "Lock in my guess" }),
    );
    expect(screen.getByText("Nice — you were close.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Guess again" }));
    fireEvent.change(slider, { target: { value: "90" } });
    await userEvent.click(
      screen.getByRole("button", { name: "Lock in my guess" }),
    );
    expect(screen.getByText("Off by")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
  });

  it("emits the guess alongside the real value", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    setup();

    fireEvent.change(screen.getByRole("slider"), { target: { value: "40" } });
    await userEvent.click(
      screen.getByRole("button", { name: "Lock in my guess" }),
    );

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "estimate-slider",
      action: "estimated",
      data: { guess: 40, answer: 30, offBy: 10, close: true },
    });
    off();
  });
});
