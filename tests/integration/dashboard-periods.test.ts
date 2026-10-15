import { describe, it, expect } from "vitest";
import { getPeriodBoundaries } from "../../src/lib/finance/periods";
import { computeDashboardMetrics } from "../../src/lib/finance/calculator";
import { Transaction } from "../../src/types";

describe("Dashboard Periods & Boundaries Integration", () => {
  const timezone = "Asia/Dhaka";
  const refDate = new Date("2026-10-15T12:00:00Z");

  it("produces enriched boundaries with label and formattedRange for all 3 periods", () => {
    const daily = getPeriodBoundaries("daily", refDate, timezone);
    expect(daily.label).toBe("Today");
    expect(daily.formattedRange).toBe("Today · 15 Oct 2026");
    expect(daily.periodStart).toBe("2026-10-15");
    expect(daily.periodEnd).toBe("2026-10-15");

    const weekly = getPeriodBoundaries("weekly", refDate, timezone);
    expect(weekly.label).toBe("This Week");
    expect(weekly.formattedRange).toBe("This Week · 12–18 Oct 2026");
    expect(weekly.periodStart).toBe("2026-10-12");
    expect(weekly.periodEnd).toBe("2026-10-18");

    const monthly = getPeriodBoundaries("monthly", refDate, timezone);
    expect(monthly.label).toBe("This Month");
    expect(monthly.formattedRange).toBe("This Month · October 2026");
    expect(monthly.periodStart).toBe("2026-10-01");
    expect(monthly.periodEnd).toBe("2026-10-31");
  });

  it("calculates period totals accurately for weekly boundaries", () => {
    const weekly = getPeriodBoundaries("weekly", refDate, timezone);

    const testTransactions: Transaction[] = [
      {
        id: "tx-in-week-1",
        business_id: "demo-biz",
        type: "SALE",
        amount: "2000.00",
        currency: "BDT",
        amount_collected_at_sale: "1500.00",
        transaction_date: "2026-10-14",
        source: "manual",
        status: "active",
        created_at: "2026-10-14T10:00:00Z",
        updated_at: "2026-10-14T10:00:00Z",
        counterparty_name: null,
        related_transaction_id: null,
        due_date: null,
        category: null,
        note: null,
        idempotency_key: null,
      },
      {
        id: "tx-outside-week",
        business_id: "demo-biz",
        type: "SALE",
        amount: "5000.00",
        currency: "BDT",
        amount_collected_at_sale: "5000.00",
        transaction_date: "2026-10-05", // Previous week
        source: "manual",
        status: "active",
        created_at: "2026-10-05T10:00:00Z",
        updated_at: "2026-10-05T10:00:00Z",
        counterparty_name: null,
        related_transaction_id: null,
        due_date: null,
        category: null,
        note: null,
        idempotency_key: null,
      },
    ];

    const metrics = computeDashboardMetrics({
      transactions: testTransactions,
      period: "weekly",
      periodStart: weekly.periodStart,
      periodEnd: weekly.periodEnd,
      currency: "BDT",
      timezone,
    });

    // Sales in weekly period should be only 2000.00, not 7000.00
    expect(metrics.sales_total).toBe("2000.00");
    expect(metrics.cash_collected_in_period).toBe("1500.00");
    // Customer receivables as of period end (2026-10-18): 500.00 remaining
    expect(metrics.customer_receivables_as_of_period_end).toBe("500.00");
  });
});
