import { describe, it, expect } from "vitest";
import {
  computeSalePaymentSplit,
  validateManualFormInput,
  PaymentStatus,
} from "../../src/lib/finance/manual-form";

describe("Manual Transaction Form Payment Status & Split Math", () => {
  it("calculates fully paid sale: cash collected equals total, zero due", () => {
    const result = computeSalePaymentSplit("2000.00", "fully_paid", "");
    expect(result.isValid).toBe(true);
    expect(result.amountCollected).toBe("2000.00");
    expect(result.customerDue).toBe("0.00");
  });

  it("calculates unpaid sale: zero cash collected, full due", () => {
    const result = computeSalePaymentSplit("2000.00", "unpaid", "");
    expect(result.isValid).toBe(true);
    expect(result.amountCollected).toBe("0.00");
    expect(result.customerDue).toBe("2000.00");
  });

  it("calculates partially paid sale: partial cash collected and remaining due", () => {
    const result = computeSalePaymentSplit("2000.00", "partially_paid", "1500.00");
    expect(result.isValid).toBe(true);
    expect(result.amountCollected).toBe("1500.00");
    expect(result.customerDue).toBe("500.00");
  });

  it("rejects partially paid sale when collected exceeds total amount", () => {
    const result = computeSalePaymentSplit("2000.00", "partially_paid", "2500.00");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("cannot exceed");
  });

  it("rejects partially paid sale with empty or negative collected amount", () => {
    const emptyResult = computeSalePaymentSplit("2000.00", "partially_paid", "");
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.error).toContain("Please enter cash collected");

    const negResult = computeSalePaymentSplit("2000.00", "partially_paid", "-50");
    expect(negResult.isValid).toBe(false);
  });

  it("requires customer name if sale has outstanding customer due", () => {
    const validation = validateManualFormInput({
      transactionType: "SALE",
      amount: "1000.00",
      paymentStatus: "partially_paid",
      amountCollectedInput: "400.00",
      counterpartyName: "", // missing
      transactionDate: "2026-10-15",
      category: "",
    });

    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain("Customer name is required when due is outstanding");
  });

  it("allows blank counterparty for fully paid sale", () => {
    const validation = validateManualFormInput({
      transactionType: "SALE",
      amount: "1000.00",
      paymentStatus: "fully_paid",
      amountCollectedInput: "",
      counterpartyName: "",
      transactionDate: "2026-10-15",
      category: "",
    });

    expect(validation.isValid).toBe(true);
    expect(validation.draft?.amount_collected_at_sale).toBe("1000.00");
  });

  it("requires supplier name for SUPPLIER_BILL and SUPPLIER_PAYMENT", () => {
    const billValidation = validateManualFormInput({
      transactionType: "SUPPLIER_BILL",
      amount: "5000.00",
      paymentStatus: "fully_paid",
      amountCollectedInput: "",
      counterpartyName: "",
      transactionDate: "2026-10-15",
      category: "",
    });
    expect(billValidation.isValid).toBe(false);
    expect(billValidation.error).toContain("Supplier name is required");
  });
});
