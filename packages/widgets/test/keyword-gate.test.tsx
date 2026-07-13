import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KeywordGate } from "@/widgets/keyword-gate";
import { onWidgetronEvent, type WidgetronEvent } from "@/lib/analytics";

describe("KeywordGate", () => {
  it("keeps the reward gated and opens it on a normalized match", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    render(
      <KeywordGate
        prompt="Type the word"
        answer="el humo"
        reward={<p>the outtake</p>}
        celebrate={false}
      />,
    );

    expect(screen.queryByText("the outtake")).not.toBeInTheDocument();

    // "Él Humo" ≠ "el humo" literally, but normalize (case/accents) matches.
    await userEvent.type(screen.getByRole("textbox"), "Él Humo");
    await userEvent.click(screen.getByRole("button", { name: /unlock/i }));

    expect(screen.getByText("the outtake")).toBeInTheDocument();
    // The star metric: correct with no hint shown = recall demonstrated.
    expect(received.at(-1)?.detail).toMatchObject({
      action: "keyword_attempt",
      data: { result: "correct" },
    });
    off();
  });

  it("does not open on a wrong answer", async () => {
    render(
      <KeywordGate
        prompt="Type the word"
        answer="the smoke"
        reward={<p>secret</p>}
        celebrate={false}
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /unlock/i }));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("skips to the reward with the invite and emits a skip attempt", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    render(
      <KeywordGate
        prompt="Type the word"
        answer="the smoke"
        reward={<p>the outtake</p>}
        invite={<p>hear the host say it</p>}
        skipLabel="I haven't heard it"
        celebrate={false}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "I haven't heard it" }),
    );

    expect(screen.getByText("the outtake")).toBeInTheDocument();
    expect(screen.getByText("hear the host say it")).toBeInTheDocument();
    expect(received.at(-1)?.detail).toMatchObject({
      action: "keyword_attempt",
      data: { result: "skip" },
    });
    off();
  });
});
