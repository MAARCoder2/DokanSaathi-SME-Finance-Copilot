import { describe, it, expect, vi, beforeEach } from "vitest";
import { GeminiProvider } from "../../src/lib/ai/gemini-provider";
import { BusinessContext } from "../../src/lib/ai/adapter";

describe("GeminiProvider (gemini-3.5-transcribe & gemini-3.5-flash-lite)", () => {
  const context: BusinessContext = {
    currency: "BDT",
    timezone: "Asia/Dhaka",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts structured transaction draft from English text note using gemini-3.5-flash-lite", async () => {
    // Mock global fetch for Gemini API
    const mockApiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  schema_version: "1.0",
                  input_language: "en",
                  source: "text",
                  raw_input: "Sold rice for 2000 BDT, customer paid 1500 cash, Rahim owes 500",
                  draft_transactions: [
                    {
                      draft_id: "draft-test-123",
                      transaction_type: "SALE",
                      transaction_date: "2026-10-15",
                      currency: "BDT",
                      currency_mentioned_by_user: "BDT",
                      amount: "2000.00",
                      amount_collected_at_sale: "1500.00",
                      counterparty_name: "Rahim",
                      related_transaction_id: null,
                      due_date: null,
                      category: null,
                      note: "Sold rice",
                      needs_clarification: false,
                      clarification_reason: null,
                    },
                  ],
                  needs_clarification: false,
                  clarification_question: null,
                }),
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    const provider = new GeminiProvider({ apiKey: "test-gemini-key" });
    const result = await provider.extractDraft(
      "Sold rice for 2000 BDT, customer paid 1500 cash, Rahim owes 500",
      context
    );

    expect(result.draft_transactions.length).toBe(1);
    const draft = result.draft_transactions[0];
    expect(draft.transaction_type).toBe("SALE");
    expect(draft.amount).toBe("2000.00");
    expect(draft.amount_collected_at_sale).toBe("1500.00");
    expect(draft.counterparty_name).toBe("Rahim");
    expect(result.needs_clarification).toBe(false);
  });

  it("handles ambiguous input by generating clarification question without guessing", async () => {
    const mockClarifyResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  schema_version: "1.0",
                  input_language: "en",
                  source: "text",
                  raw_input: "Paid 500 to Karim",
                  draft_transactions: [
                    {
                      draft_id: "draft-test-456",
                      transaction_type: "EXPENSE",
                      transaction_date: "2026-10-15",
                      currency: "BDT",
                      currency_mentioned_by_user: null,
                      amount: "500.00",
                      amount_collected_at_sale: null,
                      counterparty_name: "Karim",
                      related_transaction_id: null,
                      due_date: null,
                      category: null,
                      note: "Paid Karim",
                      needs_clarification: true,
                      clarification_reason:
                        "Was this payment to Karim for a shop expense or towards a supplier bill?",
                    },
                  ],
                  needs_clarification: true,
                  clarification_question:
                    "Was this payment to Karim for a shop expense or towards a supplier bill?",
                }),
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockClarifyResponse,
    } as Response);

    const provider = new GeminiProvider({ apiKey: "test-gemini-key" });
    const result = await provider.extractDraft("Paid 500 to Karim", context);

    expect(result.needs_clarification).toBe(true);
    expect(result.clarification_question).toContain("Karim");
  });

  it("throws descriptive error when Gemini Free Tier quota 429 is received", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: { message: "Resource has been exhausted (e.g. check quota)." },
      }),
    } as Response);

    const provider = new GeminiProvider({ apiKey: "test-gemini-key" });
    await expect(provider.extractDraft("Sold goods for 500", context)).rejects.toThrow(
      /quota/i
    );
  });
});
