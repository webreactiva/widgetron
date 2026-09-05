import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Anatomy } from "@/widgets/anatomy";
import { Checkpoint } from "@/widgets/checkpoint";
import { CodeLab } from "@/widgets/code-lab";
import { Contrast } from "@/widgets/contrast";
import { Quiz } from "@/widgets/quiz";
import { Reflection } from "@/widgets/reflection";
import { SortSteps } from "@/widgets/sort-steps";
import { SpotTheBug } from "@/widgets/spot-the-bug";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";
import { calibrationOf } from "@/primitives/confidence";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

afterEach(cleanup);

/** Collect the analytics events a widget emits during a test. */
function recorder() {
  const seen: WidgetronEventDetail[] = [];
  const off = onWidgetronEvent((event) => seen.push(event.detail));
  return { seen, off };
}

describe("confidence calibration", () => {
  it("maps the four quadrants, and only names one of them the valuable case", () => {
    expect(calibrationOf(3, false)).toBe("confident-wrong");
    expect(calibrationOf(3, true)).toBe("confident-right");
    expect(calibrationOf(1, false)).toBe("unsure-wrong");
    expect(calibrationOf(2, true)).toBe("unsure-right");
  });

  it("locks the answer until the reader has staked a confidence", () => {
    render(
      <Quiz
        confidence
        question="What makes it slow?"
        options={[
          { text: "CSS", feedback: "rarely" },
          { text: "Latency", correct: true, feedback: "yes" },
        ]}
      />,
    );
    const option = screen.getByRole("button", { name: /Latency/ });
    expect(option).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /Certain/ }));
    expect(option).not.toBeDisabled();
  });

  it("reports the quadrant in the analytics payload, and calls out confident-and-wrong", () => {
    const { seen, off } = recorder();
    render(
      <Quiz
        confidence
        question="What makes it slow?"
        options={[
          { text: "CSS", feedback: "rarely" },
          { text: "Latency", correct: true, feedback: "yes" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /Certain/ }));
    fireEvent.click(screen.getByRole("button", { name: /CSS/ }));
    off();

    const answered = seen.find((e) => e.action === "answered");
    expect(answered?.data).toMatchObject({
      correct: false,
      confidence: 3,
      calibration: "confident-wrong",
    });
    expect(
      document.querySelector('[data-calibration="confident-wrong"]'),
    ).not.toBeNull();
  });

  it("stays out of the way when it isn't asked for", () => {
    render(
      <Quiz
        question="What makes it slow?"
        options={[{ text: "CSS" }, { text: "Latency", correct: true }]}
      />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByRole("button", { name: /Latency/ })).not.toBeDisabled();
  });
});

describe("Contrast", () => {
  it("holds reality back until the reader has committed to the expectation", () => {
    render(
      <Contrast
        expected="Parsing is the bottleneck"
        actual="94% of the time is in N+1 queries"
        why="Round trips beat CPU."
      />,
    );
    expect(screen.getByText(/Parsing is the bottleneck/)).toBeTruthy();
    expect(screen.queryByText(/N\+1 queries/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /actually happens/i }));
    expect(screen.getByText(/N\+1 queries/)).toBeTruthy();
    expect(screen.getByText(/Round trips beat CPU/)).toBeTruthy();
  });

  it("shows both sides at once when the gap was already earned elsewhere", () => {
    render(
      <Contrast gate={false} expected="Sooner" actual="Later" why="Brooks." />,
    );
    expect(screen.getByText("Later")).toBeTruthy();
  });
});

describe("Checkpoint", () => {
  it("points a 'not yet' at somewhere to go back to, and keeps it out of the way otherwise", () => {
    render(
      <Checkpoint
        items={[
          { text: "Why a low hit rate wastes a cache", revisit: "Module 2" },
          { text: "What a TTL costs you" },
        ]}
      />,
    );
    expect(screen.queryByText(/Module 2/)).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /Not yet/ })[0]);
    expect(screen.getByText(/Module 2/)).toBeTruthy();
  });

  it("summarizes what is still open once every item is rated", () => {
    render(
      <Checkpoint
        items={[{ text: "One" }, { text: "Two" }]}
      />,
    );
    const can = screen.getAllByRole("button", { name: /I can say this/ });
    const notYet = screen.getAllByRole("button", { name: /Not yet/ });
    fireEvent.click(can[0]);
    fireEvent.click(notYet[1]);
    expect(screen.getByText(/1 of 2 still open/)).toBeTruthy();
  });
});

describe("Anatomy", () => {
  it("assembles the artifact from its parts and explains the one picked", () => {
    const { seen, off } = recorder();
    render(
      <Anatomy
        label="One request URL"
        layout="inline"
        parts={[
          { label: "Scheme", text: "https://", note: "Decides encryption." },
          { label: "Host", text: "api.example.com", note: "What DNS resolves." },
        ]}
      />,
    );
    expect(screen.getByText("https://")).toBeTruthy();
    expect(screen.getByText("api.example.com")).toBeTruthy();
    expect(screen.queryByText(/Decides encryption/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Scheme" }));
    off();
    expect(screen.getByText(/Decides encryption/)).toBeTruthy();
    expect(seen.find((e) => e.action === "part_inspected")?.data).toMatchObject({
      index: 0,
    });
  });
});

describe("wrong answers that teach", () => {
  it("tells a spot-the-bug reader why the line they suspected is fine", () => {
    render(
      <SpotTheBug
        lines={[
          { code: "const p = await db.update(id, data)", explanation: "Fine: it's awaited." },
          { code: "await search.reindex(p)", buggy: true, explanation: "This can throw." },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /db.update/ }));
    expect(screen.getByText(/Fine: it's awaited/)).toBeTruthy();
    expect(screen.getByText(/This line is fine/)).toBeTruthy();
  });

  it("pays off a sort-steps check with why the order is the order", () => {
    render(
      <SortSteps
        items={[
          { id: "a", label: "Request arrives" },
          { id: "b", label: "Look in the cache" },
          { id: "c", label: "Query the database" },
        ]}
        explanation="The cache is checked first — that ordering IS the pattern."
      />,
    );
    expect(screen.queryByText(/that ordering IS the pattern/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Check order/ }));
    expect(screen.getByText(/that ordering IS the pattern/)).toBeTruthy();
  });

  it("frames sort-steps as a ranking when both ends of the scale are named", () => {
    render(
      <SortSteps
        low="least coupled"
        high="most coupled"
        items={[
          { id: "a", label: "Events" },
          { id: "b", label: "HTTP calls" },
          { id: "c", label: "Shared database" },
        ]}
      />,
    );
    expect(screen.getByText("least coupled")).toBeTruthy();
    expect(screen.getByText("most coupled")).toBeTruthy();
    expect(screen.getByText(/Order them along the scale/)).toBeTruthy();
  });
});

describe("Reflection keys", () => {
  it("shows which ideas the answer touched, and never leaves the device", () => {
    const { seen, off } = recorder();
    render(
      <Reflection
        id="test-keys"
        persist={false}
        prompt="Change their mind about caching."
        keys={[
          { idea: "A low hit rate wastes the cache", match: "hit.?rate|miss" },
          { idea: "Cached data goes stale", match: "stale|invalidat" },
        ]}
      />,
    );
    const box = screen.getByRole("textbox");
    fireEvent.change(box, {
      target: { value: "With a bad hit rate you pay the lookup and get nothing back." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save my answer/ }));
    off();

    const hit = document.querySelector('li[data-hit="true"]');
    expect(hit?.textContent).toMatch(/low hit rate/);
    expect(document.querySelectorAll("li[data-hit]")).toHaveLength(1);

    const saved = seen.find((e) => e.action === "saved");
    expect(saved?.data).toMatchObject({ ideasTouched: 1, ideasTotal: 2 });
    expect(JSON.stringify(saved?.data)).not.toMatch(/hit rate you pay/);
  });

  it("counts an unparseable pattern as a miss rather than throwing the widget", () => {
    render(
      <Reflection
        id="test-bad-regex"
        persist={false}
        prompt="Anything."
        keys={[{ idea: "Broken pattern", match: "([unclosed" }]}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "A long enough answer to be committable." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save my answer/ }));
    expect(document.querySelector('li[data-hit="true"]')).toBeNull();
    expect(screen.getByText(/Broken pattern/)).toBeTruthy();
  });
});

describe("CodeLab sandboxing", () => {
  /**
   * jsdom does not execute iframe scripts, so the run itself can't be driven
   * here. What CAN be pinned is the part that would be expensive to get wrong:
   * the frame is isolated, and author code cannot break out of the tag it is
   * written into.
   */
  it("runs every variant in a frame with no same-origin access", () => {
    const { container } = render(
      <CodeLab
        question="Why is the total 0?"
        variants={[
          { label: "As shipped", code: "console.log(1);" },
          { label: "Fixed", code: "console.log(2);" },
        ]}
      />,
    );
    const frames = container.querySelectorAll("iframe");
    expect(frames).toHaveLength(2);
    for (const frame of frames) {
      expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
      expect(frame.getAttribute("sandbox")).not.toMatch(/allow-same-origin/);
    }
  });

  it("neutralizes a closing script tag inside the author's code", () => {
    const { container } = render(
      <CodeLab
        variants={[
          { label: "A", code: 'const s = "</script><img onerror=alert(1)>";' },
          { label: "B", code: "console.log(2);" },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^Run$/ })[0]);
    const doc = container.querySelector("iframe")?.getAttribute("srcdoc") ?? "";
    expect(doc).toContain("<\\/script>");
    expect(doc).not.toMatch(/[^\\]<\/script><img/);
  });

  it("prepends the shared setup to every variant, so only the difference differs", () => {
    const { container } = render(
      <CodeLab
        setup="const items = [1, 2, 3];"
        variants={[
          { label: "A", code: "console.log(items.length);" },
          { label: "B", code: "console.log(items[0]);" },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /^Run$/ })[1]);
    const doc = container.querySelectorAll("iframe")[1].getAttribute("srcdoc") ?? "";
    expect(doc).toContain("const items = [1, 2, 3];");
    expect(doc).toContain("console.log(items[0]);");
  });
});

describe("CodeLab listens in the right realm", () => {
  /**
   * Regression, found only in a real browser. A host may render a widget into
   * ANOTHER document — the playground puts every demo inside a device-frame
   * iframe — and then the component's code runs in the parent realm while its
   * DOM lives in the frame's. The sandbox posts to `parent`, which is the
   * owning document's view, so a listener on the ambient `window` sits in a
   * different realm and never hears it. The failure is silent: every run hangs
   * on "Running…" forever.
   *
   * So the setup here is the real one — a second document with its own window.
   */
  it("subscribes to the document that owns its frames, not the ambient window", () => {
    const host = document.createElement("iframe");
    document.body.appendChild(host);
    const otherDoc = host.contentDocument!;
    const otherView = host.contentWindow!;
    const mount = otherDoc.createElement("div");
    otherDoc.body.appendChild(mount);

    const other = vi.spyOn(otherView, "addEventListener");
    const ambient = vi.spyOn(window, "addEventListener");

    const { unmount } = render(
      <CodeLab
        variants={[
          { label: "A", code: "console.log(1);" },
          { label: "B", code: "console.log(2);" },
        ]}
      />,
      { container: mount },
    );

    const listensOn = (spy: ReturnType<typeof vi.spyOn>) =>
      spy.mock.calls.some(([type]) => type === "message");

    expect(listensOn(other), "the owning document's view").toBe(true);
    expect(listensOn(ambient), "the ambient window").toBe(false);

    unmount();
    host.remove();
    other.mockRestore();
    ambient.mockRestore();
  });
});
