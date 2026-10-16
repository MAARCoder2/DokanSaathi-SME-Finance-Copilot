import { describe, it, expect } from "vitest";
import { GET as getDashboard } from "../../src/app/api/dashboard/route";
import { GET as getReadiness } from "../../src/app/api/readiness/route";
import { GET as getTransactions } from "../../src/app/api/transactions/route";
import { POST as voidTransaction } from "../../src/app/api/transactions/[id]/void/route";
import { NextRequest } from "next/server";

describe("API Endpoints Integration & Financial Invariants", () => {
  it("GET /api/dashboard returns deterministic metrics and withholds profit when cost is incomplete", async () => {
    const req = new NextRequest("http://localhost:3000/api/dashboard?period=daily");
    const res = await getDashboard(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.metrics).toBeDefined();
    expect(data.metrics.sales_total).toBeDefined();
    expect(data.metrics.cash_collected_in_period).toBeDefined();
    expect(data.metrics.customer_receivables_as_of_period_end).toBeDefined();
    expect(data.metrics.supplier_payables_as_of_period_end).toBeDefined();
    expect(data.metrics.expenses_total).toBeDefined();

    // Verify profit is unavailable
    expect(data.metrics.profit_status).toBe("insufficient_cost_data");
    expect(data.metrics.profit_amount).toBeNull();
  });

  it("GET /api/readiness returns structured SME checklist items with mandatory disclaimer", async () => {
    const req = new NextRequest("http://localhost:3000/api/readiness");
    const res = await getReadiness(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.items).toHaveLength(6);
    expect(data.readiness_percentage).toBeGreaterThanOrEqual(0);
    expect(data.disclaimer).toContain("does not approve loans or guarantee financing");
  });

  it("GET /api/transactions returns filtered business transactions", async () => {
    const req = new NextRequest("http://localhost:3000/api/transactions?status=active");
    const res = await getTransactions(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.transactions)).toBe(true);
    expect(data.business_currency).toBe("BDT");
  });

  it("POST /api/transactions/[id]/void requires a reason and updates status to voided", async () => {
    // 1. Without reason -> returns 400
    const emptyReq = new NextRequest("http://localhost:3000/api/transactions/tx-demo-1/void", {
      method: "POST",
      body: JSON.stringify({ reason: "   " }),
    });
    const emptyRes = await voidTransaction(emptyReq, { params: Promise.resolve({ id: "tx-demo-1" }) });
    expect(emptyRes.status).toBe(400);

    // 2. With valid reason -> returns 200 and marks voided
    const validReq = new NextRequest("http://localhost:3000/api/transactions/tx-demo-1/void", {
      method: "POST",
      body: JSON.stringify({ reason: "Customer returned goods and requested cancellation." }),
    });
    const validRes = await voidTransaction(validReq, { params: Promise.resolve({ id: "tx-demo-1" }) });
    expect(validRes.status).toBe(200);

    const body = await validRes.json();
    expect(body.transaction.status).toBe("voided");
    expect(body.message).toContain("successfully voided");
  });
});
