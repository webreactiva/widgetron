import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

import { Quote } from "@/widgets/quote";
import { AudioClip } from "@/widgets/audio-clip";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

const CLIP = {
  src: "https://example.com/episode.mp3",
  start: 120,
  end: 296,
};

let received: WidgetronEventDetail[] = [];

beforeEach(() => {
  received = [];
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  return onWidgetronEvent((e) => received.push(e.detail));
});

describe("Quote timestamp chip (A1)", () => {
  it("renders a static 'Said at' chip when only a timestamp is given", () => {
    const { container } = render(<Quote timestamp="23:14">Words</Quote>);
    expect(container.textContent).toContain("Said at 23:14");
    expect(container.querySelector("button")).toBeNull();
  });

  it("derives the timestamp from clip.start when omitted", () => {
    const { container } = render(<Quote clip={CLIP}>Words</Quote>);
    expect(container.textContent).toContain("Said at 2:00");
  });
});

describe("Quote clip player (A2)", () => {
  it("expands a compact AudioClip from the chip and emits clip_opened once", () => {
    const { container } = render(<Quote clip={CLIP}>Words</Quote>);
    const chip = container.querySelector("button")!;
    expect(chip).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector("[data-slot=audio-clip]")).toBeNull();

    fireEvent.click(chip);
    expect(container.querySelector("[data-slot=audio-clip]")).not.toBeNull();
    const opened = received.filter(
      (d) => d.widget === "quote" && d.action === "clip_opened",
    );
    expect(opened).toHaveLength(1);
    expect(opened[0].data).toMatchObject({ start: 120 });

    // Collapsing hides the player and does not re-emit.
    fireEvent.click(chip);
    expect(container.querySelector("[data-slot=audio-clip]")).toBeNull();
    expect(
      received.filter((d) => d.action === "clip_opened"),
    ).toHaveLength(1);
  });
});

describe("AudioClip fragment window", () => {
  it("shows window-relative duration and seeks to the window start", () => {
    const { container } = render(
      <AudioClip src={CLIP.src} start={120} end={296} sticky={false} />,
    );
    const audio = container.querySelector("audio")!;
    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 1000,
    });
    fireEvent(audio, new Event("loadedmetadata"));

    // 296 - 120 = 176s → "2:56"; playback position moved to the start.
    expect(container.textContent).toContain("0:00 / 2:56");
    expect(audio.currentTime).toBe(120);
  });

  it("pauses at the window end and clamps the shown time", () => {
    const { container } = render(
      <AudioClip src={CLIP.src} start={120} end={296} sticky={false} />,
    );
    const audio = container.querySelector("audio")!;
    const pause = vi.fn();
    Object.defineProperty(audio, "paused", { configurable: true, value: false });
    Object.defineProperty(audio, "pause", { configurable: true, value: pause });
    audio.currentTime = 300; // past the window end
    fireEvent(audio, new Event("timeupdate"));

    expect(pause).toHaveBeenCalled();
    expect(container.textContent).toContain("2:56");
  });
});
