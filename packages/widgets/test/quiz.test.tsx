import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Quiz } from "@/widgets/quiz";

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
