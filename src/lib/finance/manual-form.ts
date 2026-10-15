import Decimal from "decimal.js";
import { TransactionType, DraftTransaction } from "@/types";

export type PaymentStatus = "fully_paid" | "partially_paid" | "unpaid";

export interface SalePaymentSplitResult {
  isValid: boolean;
  amountCollected?: string;
  customerDue?: string;
  error?: string;
}

export function computeSalePaymentSplit(
  totalAmountStr: string,
  paymentStatus: PaymentStatus,
  collectedInputStr: string
): SalePaymentSplitResult {
  const cleanTotal = totalAmountStr.trim();
  if (!cleanTotal || isNaN(Number(cleanTotal)) || Number(cleanTotal) <= 0) {
    return {
      isValid: false,
      error: "Please enter a valid positive total amount.",
    };
  }

  const total = new Decimal(cleanTotal);

  if (paymentStatus === "fully_paid") {
    return {
      isValid: true,
      amountCollected: total.toFixed(2),
      customerDue: "0.00",
    };
  }

  if (paymentStatus === "unpaid") {
    return {
      isValid: true,
      amountCollected: "0.00",
      customerDue: total.toFixed(2),
    };
  }

  // Partially paid
  const cleanCollected = collectedInputStr.trim();
  if (!cleanCollected || isNaN(Number(cleanCollected))) {
    return {
      isValid: false,
      error: "Please enter cash collected for partial payment.",
    };
  }

  const collected = new Decimal(cleanCollected);
  if (collected.isNegative()) {
    return {
      isValid: false,
      error: "Amount collected cannot be negative.",
    };
  }

  if (collected.greaterThan(total)) {
    return {
      isValid: false,
      error: "Amount collected at sale cannot exceed the total sale amount.",
    };
  }

  const due = total.minus(collected);

  return {
    isValid: true,
    amountCollected: collected.toFixed(2),
    customerDue: due.toFixed(2),
  };
}

export interface ManualFormValidateParams {
  transactionType: TransactionType;
  amount: string;
  paymentStatus: PaymentStatus;
  amountCollectedInput: string;
  counterpartyName: string;
  transactionDate: string;
  category?: string;
  note?: string;
  currency?: string;
}

export interface ManualFormValidateResult {
  isValid: boolean;
  error?: string;
  draft?: DraftTransaction;
}

export function validateManualFormInput(
  params: ManualFormValidateParams
): ManualFormValidateResult {
  const {
    transactionType,
    amount,
    paymentStatus,
    amountCollectedInput,
    counterpartyName,
    transactionDate,
    category = "",
    note = "",
    currency = "BDT",
  } = params;

  const cleanAmount = amount.trim();
  if (!cleanAmount || isNaN(Number(cleanAmount)) || Number(cleanAmount) <= 0) {
    return {
      isValid: false,
      error: "Please enter a valid positive total amount.",
    };
  }

  const totalDecimal = new Decimal(cleanAmount);
  let amountCollectedAtSale: string | null = null;
  let customerDue = "0.00";

  if (transactionType === "SALE") {
    const split = computeSalePaymentSplit(cleanAmount, paymentStatus, amountCollectedInput);
    if (!split.isValid) {
      return { isValid: false, error: split.error };
    }
    amountCollectedAtSale = split.amountCollected || null;
    customerDue = split.customerDue || "0.00";

    // If there is outstanding customer due, customer name is required
    if (new Decimal(customerDue).greaterThan(0) && !counterpartyName.trim()) {
      return {
        isValid: false,
        error: "Customer name is required when due is outstanding.",
      };
    }
  } else if (transactionType === "CUSTOMER_PAYMENT") {
    if (!counterpartyName.trim()) {
      return {
        isValid: false,
        error: "Customer name is required for customer payment.",
      };
    }
  } else if (transactionType === "SUPPLIER_BILL" || transactionType === "SUPPLIER_PAYMENT") {
    if (!counterpartyName.trim()) {
      return {
        isValid: false,
        error: `Supplier name is required for ${transactionType.toLowerCase().replace("_", " ")}.`,
      };
    }
  } else if (transactionType === "EXPENSE") {
    if (!category.trim()) {
      return {
        isValid: false,
        error: "Expense category is required.",
      };
    }
  }

  const draft: DraftTransaction = {
    draft_id: `man-${Date.now()}`,
    transaction_type: transactionType,
    amount: totalDecimal.toFixed(2),
    currency,
    currency_mentioned_by_user: null,
    amount_collected_at_sale: amountCollectedAtSale,
    transaction_date: transactionDate,
    counterparty_name: counterpartyName.trim() || null,
    related_transaction_id: null,
    due_date: null,
    category: transactionType === "EXPENSE" ? category.trim() : null,
    note: note.trim() || (transactionType === "EXPENSE" ? `Category: ${category.trim()}` : null),
    needs_clarification: false,
    clarification_reason: null,
  };

  return {
    isValid: true,
    draft,
  };
}
