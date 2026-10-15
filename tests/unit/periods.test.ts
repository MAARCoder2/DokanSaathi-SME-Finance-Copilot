import { describe, it, expect } from "vitest";
import { getPeriodBoundaries } from "../../src/lib/finance/periods";

describe("Timezone-Aware Period Boundaries", () => {
  const timezone = "Asia/Dhaka"; // UTC+6

  it("calculates daily period boundaries for a specific date", () => {
    const boundaries = getPeriodBoundaries("daily", new Date("2026-10-15T10:00:00Z"), timezone);
    // In Dhaka time (+6), 10:00 UTC on 2026-10-15 is 16:00 on 2026-10-15
    expect(boundaries.periodStart).toBe("2026-10-15");
    expect(boundaries.periodEnd).toBe("2026-10-15");
    expect(boundaries.period).toBe("daily");
    expect(boundaries.label).toBe("Today");
    expect(boundaries.formattedRange).toBe("Today · 15 Oct 2026");
  });

  it("calculates weekly period boundaries (Monday to Sunday) in business timezone", () => {
    // 2026-10-15 is a Thursday
    const boundaries = getPeriodBoundaries("weekly", new Date("2026-10-15T12:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-12"); // Monday
    expect(boundaries.periodEnd).toBe("2026-10-18"); // Sunday
    expect(boundaries.period).toBe("weekly");
    expect(boundaries.label).toBe("This Week");
    expect(boundaries.formattedRange).toBe("This Week · 12–18 Oct 2026");
  });

  it("calculates weekly boundaries correctly when reference date is Sunday (week-end edge case)", () => {
    // 2026-10-18 is Sunday
    const boundaries = getPeriodBoundaries("weekly", new Date("2026-10-18T10:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-12");
    expect(boundaries.periodEnd).toBe("2026-10-18");
    expect(boundaries.formattedRange).toBe("This Week · 12–18 Oct 2026");
  });

  it("calculates weekly boundaries correctly across month transitions (Oct to Nov)", () => {
    // 2026-10-29 is a Thursday. Monday is Oct 26, Sunday is Nov 01
    const boundaries = getPeriodBoundaries("weekly", new Date("2026-10-29T10:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-26");
    expect(boundaries.periodEnd).toBe("2026-11-01");
    expect(boundaries.formattedRange).toBe("This Week · 26 Oct – 1 Nov 2026");
  });

  it("calculates monthly period boundaries (1st to last day of month)", () => {
    // October 2026 has 31 days
    const boundaries = getPeriodBoundaries("monthly", new Date("2026-10-15T12:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-01");
    expect(boundaries.periodEnd).toBe("2026-10-31");
    expect(boundaries.period).toBe("monthly");
    expect(boundaries.label).toBe("This Month");
    expect(boundaries.formattedRange).toBe("This Month · October 2026");
  });

  it("handles boundary around midnight in business timezone (AC-25, T-21)", () => {
    // 2026-10-14 18:30 UTC -> 2026-10-15 00:30 in Dhaka (+6)
    const boundaries = getPeriodBoundaries("daily", new Date("2026-10-14T18:30:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-15");
    expect(boundaries.periodEnd).toBe("2026-10-15");
    expect(boundaries.formattedRange).toBe("Today · 15 Oct 2026");
  });
});
