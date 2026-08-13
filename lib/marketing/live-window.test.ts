import { describe, expect, it } from "vitest";
import { LIVE_WINDOW_MINUTES, isWithinLiveWindow } from "./live-window";

describe("isWithinLiveWindow", () => {
  const drawDateIso = "2026-08-13T01:10:00Z";
  const drawTime = new Date(drawDateIso).getTime();

  it("is false well before the draw", () => {
    const now = drawTime - (LIVE_WINDOW_MINUTES + 30) * 60_000;
    expect(isWithinLiveWindow(drawDateIso, now)).toBe(false);
  });

  it(`is true exactly ${LIVE_WINDOW_MINUTES} minutes before the draw`, () => {
    const now = drawTime - LIVE_WINDOW_MINUTES * 60_000;
    expect(isWithinLiveWindow(drawDateIso, now)).toBe(true);
  });

  it("is true after the scheduled time has passed, regardless of edition status (regression: an admin forgetting to close sales must not hide the live badge)", () => {
    const now = drawTime + 5 * 60_000;
    expect(isWithinLiveWindow(drawDateIso, now)).toBe(true);
  });
});
