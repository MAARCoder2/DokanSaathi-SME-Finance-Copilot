import { describe, it, expect } from "vitest";
import { GET as getTransactions } from "../../src/app/api/transactions/route";
import { NextRequest } from "next/server";

describe("Ledger Drill-Down & Query Intersections (Task 7)", () => {
  it("filters sales by date range matching dashboard drill-down", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/transactions?type=SALE&start=2026-10-12&end=2026-10-18"
    );
    const res = await getTransactions(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.transactions)).toBe(true);
    for (const tx of data.transactions) {
      expect(tx.type).toBe("SALE");
      expect(tx.transaction_date >= "2026-10-12").toBe(true);
      expect(tx.transaction_date <= "2026-10-18").toBe(true);
    }
  });

  it("filters cash collected view (sales with cash + customer payments)", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/transactions?view=cash_collected&start=2026-10-01&end=2026-10-31"
    );
    const res = await getTransactions(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    for (const tx of data.transactions) {
      const isSaleWithCash = tx.type === "SALE" && Number(tx.amount_collected_at_sale || 0) > 0;
      const isCustomerPayment = tx.type === "CUSTOMER_PAYMENT";
      expect(isSaleWithCash || isCustomerPayment).toBe(true);
    }
  });

  it("filters unpaid customer receivables as of period end", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/transactions?asOf=2026-10-18&unpaid=true"
    );
    const res = await getTransactions(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    for (const tx of data.transactions) {
      expect(tx.type).toBe("SALE");
      expect(tx.transaction_date <= "2026-10-18").toBe(true);
      // Must have unpaid due
      const amount = Number(tx.amount);
      const collected = Number(tx.amount_collected_at_sale || 0);
      expect(amount - collected).toBeGreaterThan(0);
    }
  });

  it("handles invalid query parameters safely without throwing 500", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/transactions?type=INVALID_FOO&start=not-a-date&asOf=garbage"
    );
    const res = await getTransactions(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.transactions)).toBe(true);
  });
});
