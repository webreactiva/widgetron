import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QaCard } from "@/widgets/qa-card";
import { onWidgetronEvent, type WidgetronEvent } from "@/lib/analytics";

describe("QaCard", () => {
  it("holds the answer back and reveals it with attribution", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    render(
      <QaCard
        question="How do you spot smoke?"
        answer="Ask about the last deploy."
        askedBy="Daniel Primo"
        answeredBy="Laura G."
        timestamp="19:12"
      />,
    );

    expect(
      screen.queryByText("Ask about the last deploy."),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /see the answer/i }),
    );

    expect(screen.getByText("Ask about the last deploy.")).toBeInTheDocument();
    expect(screen.getByText("Laura G.")).toBeInTheDocument();
    expect(received.at(-1)?.detail).toMatchObject({
      widget: "qa-card",
      action: "answer_revealed",
      data: { timestamp: "19:12" },
    });
    off();
  });
});
