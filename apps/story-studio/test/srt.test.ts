import { describe, expect, it } from "vitest";

import { applyFixes, cutRange, parseSrt, parseTimestamp } from "../src/engine/core";

const SAMPLE = `1
00:00:01,000 --> 00:00:04,500
Welcome to the episode.

2
00:00:04,500 --> 00:00:09,250
Today we talk about <i>OpenAPI</i>
and Swagger.

3
00:01:00,000 --> 00:01:03,000
Sagger is everywhere.
`;

describe("SRT utilities", () => {
  it("parses timestamps to seconds", () => {
    expect(parseTimestamp("00:00:01,000")).toBe(1);
    expect(parseTimestamp("01:02:03,450")).toBe(3723.45);
    expect(parseTimestamp("00:00:04.500")).toBe(4.5);
  });

  it("parses blocks, joins multi-line text and strips tags", () => {
    const cues = parseSrt(SAMPLE);
    expect(cues).toHaveLength(3);
    expect(cues[0]).toEqual({ start: 1, end: 4.5, text: "Welcome to the episode." });
    expect(cues[1].text).toBe("Today we talk about OpenAPI and Swagger.");
  });

  it("tolerates blocks without index line and \\r\\n endings", () => {
    const cues = parseSrt("00:00:01,000 --> 00:00:02,000\r\nHi there\r\n");
    expect(cues).toEqual([{ start: 1, end: 2, text: "Hi there" }]);
  });

  it("cuts a range and rebases times for a clipped MP3", () => {
    const cues = parseSrt(SAMPLE);
    const clip = cutRange(cues, 4.5, 70);
    expect(clip).toHaveLength(2);
    expect(clip[0]).toEqual({
      start: 0,
      end: 4.75,
      text: "Today we talk about OpenAPI and Swagger.",
    });
    expect(clip[1].start).toBe(55.5);
  });

  it("keeps absolute times with rebase: false", () => {
    const cues = parseSrt(SAMPLE);
    const clip = cutRange(cues, 4.5, 70, { rebase: false });
    expect(clip[0].start).toBe(4.5);
  });

  it("applies known ASR fixes to every cue", () => {
    const cues = applyFixes(parseSrt(SAMPLE), { Sagger: "Swagger" });
    expect(cues[2].text).toBe("Swagger is everywhere.");
  });
});
