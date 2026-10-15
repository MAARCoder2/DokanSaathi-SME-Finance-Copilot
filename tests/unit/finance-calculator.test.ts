import { describe, it, expect } from "vitest";
import {
  computeSaleSplit,
  computeDashboardMetrics,
  calculateOutstandingReceivableForSale,
  calculateOutstandingPayableForBill,
} from "../../src/lib/finance/calculator";
import { Transaction } from "../../src/types";

describe("Deterministic Financial Engine — Invariant Tests", () => {
  // Test 1: Sale Splitting Invariant (AC-07, T-05)
  describe("computeSaleSplit", () => {
    it("correctly balances total sale, cash collected, and derived customer receivable", () => {
      const result = computeSaleSplit("2000.00", "1500.00");
      expect(result.isValid).toBe(true);
      expect(result.derivedReceivable).toBe("500.00");
      expect(result.amount).toBe("2000.00");
      expect(result.amountCollected).toBe("1500.00");
    });

    it("handles fully paid sale (collected = total)", () => {
      const result = computeSaleSplit("1000.00", "1000.00");
      expect(result.isValid).toBe(true);
      expect(result.derivedReceivable).toBe("0.00");
    });

    it("handles fully unpaid credit sale (collected = 0)", () => {
      const result = computeSaleSplit("2500.00", "0.00");
      expect(result.isValid).toBe(true);
      expect(result.derivedReceivable).toBe("2500.00");
    });

    it("flags invalid when collected exceeds total sale amount", () => {
      const result = computeSaleSplit("2000.00", "2500.00");
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("PAYMENT_EXCEEDS_SALE");
    });

    it("flags invalid when collection is negative", () => {
      const result = computeSaleSplit("2000.00", "-100.00");
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("INVALID_AMOUNT");
    });

    it("flags needs_clarification when amount_collected_at_sale is null", () => {
      const result = computeSaleSplit("2000.00", null);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe("PAYMENT_SPLIT_UNKNOWN");
    });
  });

  // Test 2: Dashboard Calculation & Regression Cases (AC-07, AC-08, AC-09, AC-14)
  describe("computeDashboardMetrics", () => {
    it("AC-07: Sale of 2000 with 1500 collected -> Sales=2000, Cash=1500, Receivables=500", () => {
      const txs: Transaction[] = [
        {
          id: "tx-sale-1",
          business_id: "biz-1",
          type: "SALE",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "2000.00",
          amount_collected_at_sale: "1500.00",
          counterparty_name: "Rahim",
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: null,
          source: "text",
          status: "active",
          idempotency_key: "k1",
          created_at: "2026-10-15T10:00:00Z",
          updated_at: "2026-10-15T10:00:00Z",
        },
      ];

      const metrics = computeDashboardMetrics({
        transactions: txs,
        period: "daily",
        periodStart: "2026-10-15",
        periodEnd: "2026-10-15",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      });

      expect(metrics.sales_total).toBe("2000.00");
      expect(metrics.cash_collected_in_period).toBe("1500.00");
      expect(metrics.customer_receivables_as_of_period_end).toBe("500.00");
      expect(metrics.supplier_payables_as_of_period_end).toBe("0.00");
      expect(metrics.expenses_total).toBe("0.00");
      expect(metrics.profit_status).toBe("insufficient_cost_data");
      expect(metrics.profit_amount).toBeNull();
    });

    it("AC-08: Later customer payment of 500 increases cash, reduces receivable, but does not increase Sales", () => {
      const txs: Transaction[] = [
        // Day 1: Sale of 2000, 1500 collected, 500 due
        {
          id: "tx-sale-1",
          business_id: "biz-1",
          type: "SALE",
          transaction_date: "2026-10-14",
          currency: "BDT",
          amount: "2000.00",
          amount_collected_at_sale: "1500.00",
          counterparty_name: "Rahim",
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: null,
          source: "text",
          status: "active",
          idempotency_key: "k1",
          created_at: "2026-10-14T10:00:00Z",
          updated_at: "2026-10-14T10:00:00Z",
        },
        // Day 2: Customer payment of 500
        {
          id: "tx-pay-1",
          business_id: "biz-1",
          type: "CUSTOMER_PAYMENT",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "500.00",
          amount_collected_at_sale: null,
          counterparty_name: "Rahim",
          related_transaction_id: "tx-sale-1",
          due_date: null,
          category: null,
          note: null,
          source: "text",
          status: "active",
          idempotency_key: "k2",
          created_at: "2026-10-15T12:00:00Z",
          updated_at: "2026-10-15T12:00:00Z",
        },
      ];

      // Query for Day 2 only:
      const day2Metrics = computeDashboardMetrics({
        transactions: txs,
        period: "daily",
        periodStart: "2026-10-15",
        periodEnd: "2026-10-15",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      });

      // On Day 2: No new sales occurred
      expect(day2Metrics.sales_total).toBe("0.00");
      // Day 2 cash collected is 500.00
      expect(day2Metrics.cash_collected_in_period).toBe("500.00");
      // Customer receivables as of end of Day 2 is 0.00
      expect(day2Metrics.customer_receivables_as_of_period_end).toBe("0.00");

      // Query for full Weekly period covering Day 1 & Day 2:
      const weekMetrics = computeDashboardMetrics({
        transactions: txs,
        period: "weekly",
        periodStart: "2026-10-12",
        periodEnd: "2026-10-18",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      });

      expect(weekMetrics.sales_total).toBe("2000.00");
      // Cash collected = 1500 (at sale) + 500 (payment) = 2000
      expect(weekMetrics.cash_collected_in_period).toBe("2000.00");
      expect(weekMetrics.customer_receivables_as_of_period_end).toBe("0.00");
    });

    it("AC-09: Supplier bill 1200 and supplier payment 700 -> Outstanding payable 500; payment is not treated as a new bill or extra expense", () => {
      const txs: Transaction[] = [
        {
          id: "tx-bill-1",
          business_id: "biz-1",
          type: "SUPPLIER_BILL",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "1200.00",
          amount_collected_at_sale: null,
          counterparty_name: "Meghna Wholesalers",
          related_transaction_id: null,
          due_date: "2026-10-25",
          category: null,
          note: null,
          source: "manual",
          status: "active",
          idempotency_key: "k3",
          created_at: "2026-10-15T09:00:00Z",
          updated_at: "2026-10-15T09:00:00Z",
        },
        {
          id: "tx-spay-1",
          business_id: "biz-1",
          type: "SUPPLIER_PAYMENT",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "700.00",
          amount_collected_at_sale: null,
          counterparty_name: "Meghna Wholesalers",
          related_transaction_id: "tx-bill-1",
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "active",
          idempotency_key: "k4",
          created_at: "2026-10-15T15:00:00Z",
          updated_at: "2026-10-15T15:00:00Z",
        },
      ];

      const metrics = computeDashboardMetrics({
        transactions: txs,
        period: "daily",
        periodStart: "2026-10-15",
        periodEnd: "2026-10-15",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      });

      expect(metrics.supplier_payables_as_of_period_end).toBe("500.00");
      // The 700 payment must NOT increase expenses
      expect(metrics.expenses_total).toBe("0.00");
    });

    it("Voided transactions are completely excluded from dashboard calculations", () => {
      const txs: Transaction[] = [
        {
          id: "tx-sale-active",
          business_id: "biz-1",
          type: "SALE",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "1000.00",
          amount_collected_at_sale: "1000.00",
          counterparty_name: null,
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "active",
          idempotency_key: "ka",
          created_at: "2026-10-15T10:00:00Z",
          updated_at: "2026-10-15T10:00:00Z",
        },
        {
          id: "tx-sale-voided",
          business_id: "biz-1",
          type: "SALE",
          transaction_date: "2026-10-15",
          currency: "BDT",
          amount: "5000.00",
          amount_collected_at_sale: "5000.00",
          counterparty_name: null,
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "voided",
          idempotency_key: "kv",
          created_at: "2026-10-15T10:00:00Z",
          updated_at: "2026-10-15T11:00:00Z",
        },
      ];

      const metrics = computeDashboardMetrics({
        transactions: txs,
        period: "daily",
        periodStart: "2026-10-15",
        periodEnd: "2026-10-15",
        currency: "BDT",
        timezone: "Asia/Dhaka",
      });

      expect(metrics.sales_total).toBe("1000.00");
      expect(metrics.cash_collected_in_period).toBe("1000.00");
    });
  });

  // Test 3: Outstanding calculation helpers
  describe("Outstanding balance helpers", () => {
    it("calculateOutstandingReceivableForSale subtracts linked active payments", () => {
      const sale: Transaction = {
        id: "s1",
        business_id: "b1",
        type: "SALE",
        transaction_date: "2026-10-01",
        currency: "BDT",
        amount: "3000.00",
        amount_collected_at_sale: "1000.00",
        counterparty_name: "Customer X",
        related_transaction_id: null,
        due_date: null,
        category: null,
        note: null,
        source: "text",
        status: "active",
        idempotency_key: null,
        created_at: "",
        updated_at: "",
      };

      const payments: Transaction[] = [
        {
          id: "p1",
          business_id: "b1",
          type: "CUSTOMER_PAYMENT",
          transaction_date: "2026-10-05",
          currency: "BDT",
          amount: "800.00",
          amount_collected_at_sale: null,
          counterparty_name: null,
          related_transaction_id: "s1",
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "active",
          idempotency_key: null,
          created_at: "",
          updated_at: "",
        },
        {
          id: "p2",
          business_id: "b1",
          type: "CUSTOMER_PAYMENT",
          transaction_date: "2026-10-06",
          currency: "BDT",
          amount: "200.00",
          amount_collected_at_sale: null,
          counterparty_name: null,
          related_transaction_id: "s1",
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "voided", // Voided, must be ignored!
          idempotency_key: null,
          created_at: "",
          updated_at: "",
        },
      ];

      // Initial due was 2000.00 (3000 - 1000). Payment p1 is 800.00. Remaining: 1200.00.
      const outstanding = calculateOutstandingReceivableForSale(sale, payments);
      expect(outstanding).toBe("1200.00");
    });

    it("calculateOutstandingPayableForBill subtracts linked active supplier payments", () => {
      const bill: Transaction = {
        id: "b1",
        business_id: "b1",
        type: "SUPPLIER_BILL",
        transaction_date: "2026-10-01",
        currency: "BDT",
        amount: "5000.00",
        amount_collected_at_sale: null,
        counterparty_name: "Supplier Y",
        related_transaction_id: null,
        due_date: null,
        category: null,
        note: null,
        source: "manual",
        status: "active",
        idempotency_key: null,
        created_at: "",
        updated_at: "",
      };

      const payments: Transaction[] = [
        {
          id: "sp1",
          business_id: "b1",
          type: "SUPPLIER_PAYMENT",
          transaction_date: "2026-10-10",
          currency: "BDT",
          amount: "2000.00",
          amount_collected_at_sale: null,
          counterparty_name: null,
          related_transaction_id: "b1",
          due_date: null,
          category: null,
          note: null,
          source: "manual",
          status: "active",
          idempotency_key: null,
          created_at: "",
          updated_at: "",
        },
      ];

      const outstanding = calculateOutstandingPayableForBill(bill, payments);
      expect(outstanding).toBe("3000.00");
    });
  });
});
