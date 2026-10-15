import { LedgerDraftPayload, DraftTransaction } from "../../types";
import { BusinessContext, TextExtractionProvider } from "./adapter";

/**
 * Deterministic MockProvider for offline resilience, competition demos, and test suites.
 * Implements high-precision pattern recognition for natural language English shop statements.
 */
export class MockProvider implements TextExtractionProvider {
  async extractDraft(rawInput: string, context: BusinessContext): Promise<LedgerDraftPayload> {
    const text = rawInput.trim();
    const lower = text.toLowerCase();
    const todayStr = new Date().toISOString().split("T")[0];

    // Detect mentioned currency
    let currencyMentioned: string | null = null;
    if (lower.includes("dollar") || lower.includes("usd") || lower.includes("$")) {
      currencyMentioned = "USD";
    } else if (lower.includes("taka") || lower.includes("bdt") || lower.includes("৳")) {
      currencyMentioned = "BDT";
    } else if (lower.includes("euro") || lower.includes("eur") || lower.includes("€")) {
      currencyMentioned = "EUR";
    } else if (lower.includes("rupee") || lower.includes("inr") || lower.includes("₹")) {
      currencyMentioned = "INR";
    }

    const hasCurrencyMismatch = Boolean(currencyMentioned && currencyMentioned !== context.currency);

    // 1. SALE with split: "sold ... for 2000 ... paid 1500 ... owes 500"
    const saleSplitRegex = /sold(?:\s+[a-z]+)?(?:\s+for)?\s+(\d+(?:\.\d+)?).*?(?:paid|received|collected)\s+(\d+(?:\.\d+)?).*?(?:owes|due)\s+(\d+(?:\.\d+)?)/i;
    const saleSplitMatch = text.match(saleSplitRegex);
    if (saleSplitMatch) {
      const totalAmount = parseFloat(saleSplitMatch[1]).toFixed(2);
      const paidAmount = parseFloat(saleSplitMatch[2]).toFixed(2);

      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "SALE",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount: totalAmount,
            amount_collected_at_sale: paidAmount,
            counterparty_name: this.extractName(text),
            related_transaction_id: null,
            due_date: null,
            category: null,
            note: null,
            needs_clarification: hasCurrencyMismatch,
            clarification_reason: hasCurrencyMismatch ? "Currency mismatch" : null,
          },
        ],
        needs_clarification: hasCurrencyMismatch,
        clarification_question: hasCurrencyMismatch
          ? `The input mentions ${currencyMentioned}, but your business currency is ${context.currency}. Please confirm which currency to use.`
          : null,
      };
    }

    // 2. SALE paid in full or simple sale: "sold goods for 50 ... paid in full"
    if (lower.includes("sold") && (lower.includes("paid in full") || lower.includes("cash"))) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : "0.00";
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "SALE",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: amount, // paid in full
            counterparty_name: this.extractName(text),
            related_transaction_id: null,
            due_date: null,
            category: null,
            note: null,
            needs_clarification: hasCurrencyMismatch,
            clarification_reason: hasCurrencyMismatch ? "Currency mismatch" : null,
          },
        ],
        needs_clarification: hasCurrencyMismatch,
        clarification_question: hasCurrencyMismatch
          ? `The input mentions ${currencyMentioned}, but your business currency is ${context.currency}.`
          : null,
      };
    }

    // 3. Ambiguous SALE (No payment split mentioned): "sold ... for 2000"
    if (lower.includes("sold")) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : null;
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "SALE",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: null, // UNKNOWN SPLIT!
            counterparty_name: this.extractName(text),
            related_transaction_id: null,
            due_date: null,
            category: null,
            note: null,
            needs_clarification: true,
            clarification_reason: "Payment split unknown",
          },
        ],
        needs_clarification: true,
        clarification_question: "How much of the sale was paid at the time, and how much is still owed?",
      };
    }

    // 4. CUSTOMER PAYMENT: "Customer Rahim paid 500 ..."
    if (lower.includes("customer") || (lower.includes("paid") && (lower.includes("due") || lower.includes("earlier")))) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : "0.00";
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "CUSTOMER_PAYMENT",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: null,
            counterparty_name: this.extractName(text),
            related_transaction_id: "target-sale-id", // To be selected or confirmed
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
    }

    // 5. SUPPLIER PAYMENT: "Paid supplier ... 700"
    if (lower.includes("paid supplier") || (lower.includes("supplier") && lower.includes("paid"))) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : "0.00";
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "SUPPLIER_PAYMENT",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: null,
            counterparty_name: this.extractSupplierName(text),
            related_transaction_id: "target-bill-id",
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
    }

    // 6. SUPPLIER BILL: "Supplier ... bill ... 1200"
    if (lower.includes("supplier") && (lower.includes("bill") || lower.includes("worth") || lower.includes("owe"))) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : "0.00";
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "SUPPLIER_BILL",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: null,
            counterparty_name: this.extractSupplierName(text),
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
    }

    // 7. EXPENSE: "Paid ... electricity bill / rent / tea ... 400"
    if (lower.includes("expense") || lower.includes("electricity") || lower.includes("rent") || lower.includes("transport")) {
      const numMatch = text.match(/(\d+(?:\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : "0.00";
      return {
        schema_version: "1.0",
        input_language: "en",
        source: "text",
        raw_input: text,
        draft_transactions: [
          {
            draft_id: "draft-1",
            transaction_type: "EXPENSE",
            transaction_date: todayStr,
            currency: context.currency,
            currency_mentioned_by_user: currencyMentioned,
            amount,
            amount_collected_at_sale: null,
            counterparty_name: null,
            related_transaction_id: null,
            due_date: null,
            category: lower.includes("electricity") ? "Utilities" : "General Expense",
            note: text,
            needs_clarification: false,
            clarification_reason: null,
          },
        ],
        needs_clarification: false,
        clarification_question: null,
      };
    }

    // Default Fallback
    const numMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = numMatch ? parseFloat(numMatch[1]).toFixed(2) : null;
    return {
      schema_version: "1.0",
      input_language: "en",
      source: "text",
      raw_input: text,
      draft_transactions: [
        {
          draft_id: "draft-1",
          transaction_type: "SALE",
          transaction_date: todayStr,
          currency: context.currency,
          currency_mentioned_by_user: currencyMentioned,
          amount,
          amount_collected_at_sale: null,
          counterparty_name: null,
          related_transaction_id: null,
          due_date: null,
          category: null,
          note: text,
          needs_clarification: true,
          clarification_reason: "Transaction type or details unclear",
        },
      ],
      needs_clarification: true,
      clarification_question: "Could you clarify if this was a Sale, Customer Payment, Supplier Bill, or Expense?",
    };
  }

  private extractName(text: string): string | null {
    const match = text.match(/(?:customer|to|from)\s+([A-Z][a-z]+)/i);
    if (match && !["owes", "due", "paid", "bill", "payment", "unpaid", "bought"].includes(match[1].toLowerCase())) {
      return match[1];
    }
    return null;
  }

  private extractSupplierName(text: string): string | null {
    if (text.includes("Meghna Wholesalers")) {
      return "Meghna Wholesalers";
    }
    if (text.includes("Meghna")) {
      return "Meghna";
    }
    const match = text.match(/(?:supplier|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (match && !["bill", "payment", "due", "goods"].includes(match[1].toLowerCase())) {
      return match[1];
    }
    return null;
  }
}
