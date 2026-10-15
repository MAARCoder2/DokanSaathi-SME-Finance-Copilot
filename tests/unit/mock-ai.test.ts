import { describe, it, expect } from "vitest";
import { MockProvider } from "../../src/lib/ai/mock-provider";

describe("Milestone C: Provider-Neutral AI Extraction (MockProvider)", () => {
  const provider = new MockProvider();
  const context = { currency: "BDT", timezone: "Asia/Dhaka" };

  it("extracts a complete partially-paid sale (AC-01, AC-07, T-01, T-05)", async () => {
    const input = "I sold goods for 2000 today. The customer paid 1500 and still owes 500.";
    const result = await provider.extractDraft(input, context);

    expect(result.schema_version).toBe("1.0");
    expect(result.input_language).toBe("en");
    expect(result.draft_transactions).toHaveLength(1);

    const tx = result.draft_transactions[0];
    expect(tx.transaction_type).toBe("SALE");
    expect(tx.amount).toBe("2000.00");
    expect(tx.amount_collected_at_sale).toBe("1500.00");
    expect(result.needs_clarification).toBe(false);
  });

  it("extracts a customer payment (AC-08, T-06)", async () => {
    const input = "Customer Rahim paid 500 today for his earlier due.";
    const result = await provider.extractDraft(input, context);

    expect(result.draft_transactions).toHaveLength(1);
    const tx = result.draft_transactions[0];
    expect(tx.transaction_type).toBe("CUSTOMER_PAYMENT");
    expect(tx.amount).toBe("500.00");
    expect(tx.counterparty_name).toBe("Rahim");
  });

  it("extracts a supplier bill (AC-09, T-09)", async () => {
    const input = "Received supplier bill from Meghna Wholesalers for 1200.";
    const result = await provider.extractDraft(input, context);

    expect(result.draft_transactions).toHaveLength(1);
    const tx = result.draft_transactions[0];
    expect(tx.transaction_type).toBe("SUPPLIER_BILL");
    expect(tx.amount).toBe("1200.00");
    expect(tx.counterparty_name).toBe("Meghna Wholesalers");
  });

  it("extracts a supplier payment (AC-09, T-09)", async () => {
    const input = "Paid supplier Meghna 700 against our bill.";
    const result = await provider.extractDraft(input, context);

    expect(result.draft_transactions).toHaveLength(1);
    const tx = result.draft_transactions[0];
    expect(tx.transaction_type).toBe("SUPPLIER_PAYMENT");
    expect(tx.amount).toBe("700.00");
    expect(tx.counterparty_name).toBe("Meghna");
  });

  it("extracts an expense (T-10)", async () => {
    const input = "Paid shop electricity bill 400 cash today.";
    const result = await provider.extractDraft(input, context);

    expect(result.draft_transactions).toHaveLength(1);
    const tx = result.draft_transactions[0];
    expect(tx.transaction_type).toBe("EXPENSE");
    expect(tx.amount).toBe("400.00");
  });

  it("flags needs_clarification when payment split is not stated for sale (AC-10, T-07)", async () => {
    const input = "I sold goods for 2000 today to Karim.";
    const result = await provider.extractDraft(input, context);

    expect(result.needs_clarification).toBe(true);
    expect(result.clarification_question).toContain("How much of the sale was paid at the time");
  });

  it("flags currency mismatch when user specifies foreign currency (T-12)", async () => {
    const input = "Sold goods for 50 dollars today, paid in full.";
    const result = await provider.extractDraft(input, context);

    const tx = result.draft_transactions[0];
    expect(tx.currency_mentioned_by_user).toBe("USD");
    expect(tx.needs_clarification).toBe(true);
  });
});
