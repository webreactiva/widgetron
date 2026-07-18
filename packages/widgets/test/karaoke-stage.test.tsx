import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { KaraokeStage } from "@/widgets/karaoke-stage";
import { onWidgetronEvent, type WidgetronEvent } from "@/lib/analytics";

const CUES = [
  { start: 0, end: 2, text: "Smoke looks like work." },
  { start: 2, end: 4, text: "It leaves no trace." },
];

describe("KaraokeStage", () => {
  it("renders every cue's words on the stage", () => {
    render(<KaraokeStage transcript={CUES} eyebrow="WR 300" />);
    expect(screen.getByText("Smoke")).toBeInTheDocument();
    expect(screen.getByText("trace.")).toBeInTheDocument();
    expect(screen.getByText("WR 300")).toBeInTheDocument();
  });

  it("switches typographic mode and emits mode_changed", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    const { container } = render(<KaraokeStage transcript={CUES} />);
    const root = container.querySelector('[data-slot="karaoke-stage"]');
    expect(root).toHaveAttribute("data-mode", "lines");

    await userEvent.click(screen.getByRole("button", { name: /word by word/i }));

    expect(root).toHaveAttribute("data-mode", "words");
    expect(received.at(-1)?.detail).toMatchObject({
      widget: "karaoke-stage",
      action: "mode_changed",
      data: { mode: "words" },
    });
    off();
  });

  it("plays without audio (self-paced) and emits played once", async () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));
    render(<KaraokeStage transcript={CUES} />);

    const play = screen.getByRole("button", { name: "Play" });
    await userEvent.click(play);

    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(
      received.filter((e) => e.detail.action === "played"),
    ).toHaveLength(1);
    off();
  });
});
