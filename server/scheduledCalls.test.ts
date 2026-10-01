import { describe, expect, it } from "vitest";
import { validateScheduledFor } from "./routers/scheduledCalls";
import { centralToUtcIso } from "../client/src/components/ScheduleCallDialog";

describe("validateScheduledFor", () => {
  const now = new Date("2026-10-01T18:00:00Z").getTime();

  it("rejects invalid dates", () => {
    expect(validateScheduledFor("not-a-date", now)).toMatch(/valid date/);
  });

  it("rejects times less than 15 minutes out", () => {
    const soon = new Date(now + 5 * 60 * 1000).toISOString();
    expect(validateScheduledFor(soon, now)).toMatch(/15 minutes/);
  });

  it("rejects times more than 30 days out", () => {
    const far = new Date(now + 31 * 24 * 60 * 60 * 1000).toISOString();
    expect(validateScheduledFor(far, now)).toMatch(/30 days/);
  });

  it("accepts a time comfortably in range", () => {
    const ok = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    expect(validateScheduledFor(ok, now)).toBeNull();
  });
});

describe("centralToUtcIso", () => {
  it("converts a CDT wall time (UTC-5) to UTC", () => {
    // Oct 1 2026 is daylight time in Chicago (CDT = UTC-5)
    expect(centralToUtcIso("2026-10-01", "14:00")).toBe("2026-10-01T19:00:00.000Z");
  });

  it("converts a CST wall time (UTC-6) to UTC", () => {
    // Jan 15 2026 is standard time in Chicago (CST = UTC-6)
    expect(centralToUtcIso("2026-01-15", "14:00")).toBe("2026-01-15T20:00:00.000Z");
  });

  it("round-trips through the America/Chicago zone", () => {
    const iso = centralToUtcIso("2026-10-01", "09:30");
    const back = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
    expect(back).toBe("09:30");
  });
});
