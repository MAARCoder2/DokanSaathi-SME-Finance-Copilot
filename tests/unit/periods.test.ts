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
  });

  it("calculates weekly period boundaries (Monday to Sunday) in business timezone", () => {
    // 2026-10-15 is a Thursday
    const boundaries = getPeriodBoundaries("weekly", new Date("2026-10-15T12:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-12"); // Monday
    expect(boundaries.periodEnd).toBe("2026-10-18"); // Sunday
    expect(boundaries.period).toBe("weekly");
  });

  it("calculates monthly period boundaries (1st to last day of month)", () => {
    // October 2026 has 31 days
    const boundaries = getPeriodBoundaries("monthly", new Date("2026-10-15T12:00:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-01");
    expect(boundaries.periodEnd).toBe("2026-10-31");
    expect(boundaries.period).toBe("monthly");
  });

  it("handles boundary around midnight in business timezone (AC-25, T-21)", () => {
    // 2026-10-14 18:30 UTC -> 2026-10-15 00:30 in Dhaka (+6)
    const boundaries = getPeriodBoundaries("daily", new Date("2026-10-14T18:30:00Z"), timezone);
    expect(boundaries.periodStart).toBe("2026-10-15");
    expect(boundaries.periodEnd).toBe("2026-10-15");
  });
});
