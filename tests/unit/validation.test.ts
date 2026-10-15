import { describe, it, expect } from "vitest";
import { validateDraftTransaction, validateLedgerDraftPayload } from "../../src/lib/validation/transaction-schema";
import { DraftTransaction, LedgerDraftPayload } from "../../src/types";

describe("Milestone C: Schema Validation & Invariant Checking", () => {
  const businessCurrency = "BDT";

  it("validates a complete SALE draft transaction (AC-01, AC-07)", () => {
    const draft: DraftTransaction = {
      draft_id: "d1",
      transaction_type: "SALE",
      transaction_date: "2026-10-15",
      currency: "BDT",
      currency_mentioned_by_user: null,
      amount: "2000.00",
      amount_collected_at_sale: "1500.00",
      counterparty_name: "Rahim",
      related_transaction_id: null,
      due_date: null,
      category: null,
      note: null,
      needs_clarification: false,
      clarification_reason: null,
    };

    const result = validateDraftTransaction(draft, businessCurrency);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("flags PAYMENT_SPLIT_UNKNOWN when SALE amount_collected_at_sale is null (AC-10, T-07)", () => {
    const draft: DraftTransaction = {
      draft_id: "d2",
      transaction_type: "SALE",
      transaction_date: "2026-10-15",
      currency: "BDT",
      currency_mentioned_by_user: null,
      amount: "2000.00",
      amount_collected_at_sale: null, // Split unknown
      counterparty_name: null,
      related_transaction_id: null,
      due_date: null,
      category: null,
      note: null,
      needs_clarification: true,
      clarification_reason: "Payment split unknown",
    };

    const result = validateDraftTransaction(draft, businessCurrency);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "PAYMENT_SPLIT_UNKNOWN")).toBe(true);
  });

  it("flags PAYMENT_EXCEEDS_SALE when amount_collected_at_sale > amount (AC-11)", () => {
    const draft: DraftTransaction = {
      draft_id: "d3",
      transaction_type: "SALE",
      transaction_date: "2026-10-15",
      currency: "BDT",
      currency_mentioned_by_user: null,
      amount: "1000.00",
      amount_collected_at_sale: "1500.00",
      counterparty_name: null,
      related_transaction_id: null,
      due_date: null,
      category: null,
      note: null,
      needs_clarification: false,
      clarification_reason: null,
    };

    const result = validateDraftTransaction(draft, businessCurrency);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "PAYMENT_EXCEEDS_SALE")).toBe(true);
  });

  it("flags CURRENCY_MISMATCH when user mentions a currency different from business settings (AC-25, T-12)", () => {
    const draft: DraftTransaction = {
      draft_id: "d4",
      transaction_type: "SALE",
      transaction_date: "2026-10-15",
      currency: "BDT",
      currency_mentioned_by_user: "USD", // User said dollars in a BDT shop
      amount: "50.00",
      amount_collected_at_sale: "50.00",
      counterparty_name: null,
      related_transaction_id: null,
      due_date: null,
      category: null,
      note: null,
      needs_clarification: true,
      clarification_reason: "Currency mismatch",
    };

    const result = validateDraftTransaction(draft, businessCurrency);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "CURRENCY_MISMATCH")).toBe(true);
  });

  it("validates full LedgerDraftPayload shape", () => {
    const payload: LedgerDraftPayload = {
      schema_version: "1.0",
      input_language: "en",
      source: "text",
      raw_input: "Sold 2000, 1500 cash, 500 due",
      draft_transactions: [
        {
          draft_id: "d1",
          transaction_type: "SALE",
          transaction_date: "2026-10-15",
          currency: "BDT",
          currency_mentioned_by_user: null,
          amount: "2000.00",
          amount_collected_at_sale: "1500.00",
          counterparty_name: null,
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: null,
          needs_clarification: false,
          clarification_reason: null,
        },
      ],
      needs_clarification: false,
      clarification_question: null,
    };

    const result = validateLedgerDraftPayload(payload, businessCurrency);
    expect(result.status).toBe("valid");
    expect(result.errors).toHaveLength(0);
  });
});
