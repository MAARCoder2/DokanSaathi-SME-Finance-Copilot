import { describe, it, expect } from "vitest";
import { computeDashboardMetrics } from "../../src/lib/finance/calculator";
import { Transaction } from "../../src/types";

describe("Ledger Financial Invariants & Scenarios", () => {
  const baseTx: Omit<Transaction, "id" | "type" | "amount" | "created_at" | "updated_at" | "transaction_date"> = {
    business_id: "biz-123",
    currency: "BDT",
    amount_collected_at_sale: null,
    counterparty_name: null,
    related_transaction_id: null,
    due_date: null,
    category: null,
    status: "active",
    source: "text",
    note: null,
    idempotency_key: null,
  };

  const defaultParams = {
    period: "daily" as const,
    periodStart: "2026-10-15",
    periodEnd: "2026-10-15",
    currency: "BDT",
    timezone: "Asia/Dhaka",
  };

  it("Scenario 1 & 2: Sale of 2,000 with 1,500 collected, followed by 500 later payment", () => {
    // 1. Initial Sale: 2000 total, 1500 collected at sale
    const saleTx: Transaction = {
      ...baseTx,
      id: "tx-sale-1",
      type: "SALE",
      amount: "2000.00",
      amount_collected_at_sale: "1500.00",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T09:00:00Z",
      updated_at: "2026-10-15T09:00:00Z",
    };

    const initialMetrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [saleTx],
    });
    expect(initialMetrics.sales_total).toBe("2000.00");
    expect(initialMetrics.cash_collected_in_period).toBe("1500.00");
    expect(initialMetrics.customer_receivables_as_of_period_end).toBe("500.00");

    // 2. Later Customer Payment of 500
    const paymentTx: Transaction = {
      ...baseTx,
      id: "tx-pay-1",
      type: "CUSTOMER_PAYMENT",
      amount: "500.00",
      related_transaction_id: "tx-sale-1",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T14:00:00Z",
      updated_at: "2026-10-15T14:00:00Z",
    };

    const updatedMetrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [saleTx, paymentTx],
    });
    // CRITICAL INVARIANT: Total sales MUST NOT increase with customer payment
    expect(updatedMetrics.sales_total).toBe("2000.00");
    // Cash collected increases by 500 (1500 + 500 = 2000)
    expect(updatedMetrics.cash_collected_in_period).toBe("2000.00");
    // Outstanding receivable is now fully cleared (500 - 500 = 0)
    expect(updatedMetrics.customer_receivables_as_of_period_end).toBe("0.00");
  });

  it("Scenario 3: Supplier bill and later supplier payment reduces payables without duplicating bills", () => {
    const billTx: Transaction = {
      ...baseTx,
      id: "tx-bill-1",
      type: "SUPPLIER_BILL",
      amount: "3000.00",
      counterparty_name: "Meghna Wholesalers",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T09:00:00Z",
      updated_at: "2026-10-15T09:00:00Z",
    };

    const billMetrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [billTx],
    });
    expect(billMetrics.supplier_payables_as_of_period_end).toBe("3000.00");

    // Payment to supplier of 1,000
    const supplierPayTx: Transaction = {
      ...baseTx,
      id: "tx-suppay-1",
      type: "SUPPLIER_PAYMENT",
      amount: "1000.00",
      counterparty_name: "Meghna Wholesalers",
      related_transaction_id: "tx-bill-1",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T11:00:00Z",
      updated_at: "2026-10-15T11:00:00Z",
    };

    const afterPaymentMetrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [billTx, supplierPayTx],
    });
    // Outstanding payable drops by 1000 (3000 - 1000 = 2000)
    expect(afterPaymentMetrics.supplier_payables_as_of_period_end).toBe("2000.00");
    // Does NOT alter sales
    expect(afterPaymentMetrics.sales_total).toBe("0.00");
  });

  it("Scenario 4: Voided transactions are strictly excluded from financial totals", () => {
    const activeSale: Transaction = {
      ...baseTx,
      id: "tx-sale-active",
      type: "SALE",
      amount: "1000.00",
      amount_collected_at_sale: "1000.00",
      status: "active",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
    };

    const voidedSale: Transaction = {
      ...baseTx,
      id: "tx-sale-voided",
      type: "SALE",
      amount: "5000.00",
      amount_collected_at_sale: "5000.00",
      status: "voided",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T10:30:00Z",
      updated_at: "2026-10-15T11:00:00Z",
    };

    const metrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [activeSale, voidedSale],
    });
    expect(metrics.sales_total).toBe("1000.00");
    expect(metrics.cash_collected_in_period).toBe("1000.00");
  });

  it("Scenario 5: Incomplete cost data guarantees profit is unavailable", () => {
    const saleTx: Transaction = {
      ...baseTx,
      id: "tx-sale-nocost",
      type: "SALE",
      amount: "4000.00",
      amount_collected_at_sale: "4000.00",
      transaction_date: "2026-10-15",
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
    };

    const metrics = computeDashboardMetrics({
      ...defaultParams,
      transactions: [saleTx],
    });
    expect(metrics.profit_status).toBe("insufficient_cost_data");
    expect(metrics.profit_amount).toBeNull();
  });
});
