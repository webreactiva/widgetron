import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Quiz } from "@/widgets/quiz";
import { onWidgetronEvent, type WidgetronEvent } from "@/lib/analytics";

const options = [
  { text: "Wrong answer", feedback: "Not this one." },
  { text: "Right answer", correct: true, feedback: "Exactly right!" },
];

describe("Quiz", () => {
  it("reveals feedback and reports the answer", async () => {
    const onAnswered = vi.fn();
    render(
      <Quiz
        question="Q?"
        options={options}
        celebrate={false}
        onAnswered={onAnswered}
      />,
    );

    await userEvent.click(screen.getByText("Right answer"));

    expect(screen.getByText("Exactly right!")).toBeInTheDocument();
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(onAnswered).toHaveBeenCalledWith(
      expect.objectContaining({ correct: true }),
      1,
      true,
    );
  });

  it("emits an 'answered' analytics event from its root element", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    const { container } = render(
      <Quiz question="Q?" options={options} celebrate={false} />,
    );

    await userEvent.click(screen.getByText("Right answer"));

    expect(received).toHaveLength(1);
    expect(received[0].detail).toMatchObject({
      source: "widget",
      widget: "quiz",
      action: "answered",
      data: { index: 1, correct: true },
    });
    expect(received[0].target).toBe(
      container.querySelector("[data-slot=quiz]"),
    );
    off();
  });

  it("uses translated labels", async () => {
    render(
      <Quiz
        question="Q?"
        options={options}
        celebrate={false}
        labels={{ incorrect: "Casi" }}
      />,
    );

    await userEvent.click(screen.getByText("Wrong answer"));
    expect(screen.getByText("Casi")).toBeInTheDocument();
  });
});
