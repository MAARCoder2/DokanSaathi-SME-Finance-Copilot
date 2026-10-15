import Decimal from "decimal.js";
import { Transaction, PeriodType, DashboardSummary } from "../../types";

export interface SaleSplitResult {
  isValid: boolean;
  amount?: string;
  amountCollected?: string;
  derivedReceivable?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Validates and balances a SALE transaction split.
 * Invariant: total_sale = amount_collected_at_sale + customer_receivable
 */
export function computeSaleSplit(
  amountStr: string,
  amountCollectedStr: string | null
): SaleSplitResult {
  if (amountCollectedStr === null || amountCollectedStr === undefined) {
    return {
      isValid: false,
      errorCode: "PAYMENT_SPLIT_UNKNOWN",
      message: "Please specify how much of the sale was collected and how much is owed.",
    };
  }

  let amount: Decimal;
  let collected: Decimal;

  try {
    amount = new Decimal(amountStr);
    collected = new Decimal(amountCollectedStr);
  } catch {
    return {
      isValid: false,
      errorCode: "INVALID_AMOUNT",
      message: "Amounts must be valid finite numbers.",
    };
  }

  if (amount.isNegative() || collected.isNegative()) {
    return {
      isValid: false,
      errorCode: "INVALID_AMOUNT",
      message: "Amounts cannot be negative.",
    };
  }

  if (collected.greaterThan(amount)) {
    return {
      isValid: false,
      errorCode: "PAYMENT_EXCEEDS_SALE",
      message: "Amount collected at sale cannot exceed the total sale amount.",
    };
  }

  const receivable = amount.minus(collected);

  return {
    isValid: true,
    amount: amount.toFixed(2),
    amountCollected: collected.toFixed(2),
    derivedReceivable: receivable.toFixed(2),
  };
}

/**
 * Calculates remaining outstanding receivable for a specific credit sale.
 */
export function calculateOutstandingReceivableForSale(
  sale: Transaction,
  allPayments: Transaction[],
  asOfDate?: string
): string {
  if (sale.status === "voided" || sale.type !== "SALE") {
    return "0.00";
  }

  const total = new Decimal(sale.amount);
  const collectedAtSale = new Decimal(sale.amount_collected_at_sale || "0");
  let remaining = total.minus(collectedAtSale);

  const linkedPayments = allPayments.filter(
    (tx) =>
      tx.status === "active" &&
      tx.type === "CUSTOMER_PAYMENT" &&
      tx.related_transaction_id === sale.id &&
      (!asOfDate || tx.transaction_date <= asOfDate)
  );

  for (const p of linkedPayments) {
    remaining = remaining.minus(new Decimal(p.amount));
  }

  return remaining.isNegative() ? "0.00" : remaining.toFixed(2);
}

/**
 * Calculates remaining outstanding payable for a specific supplier bill.
 */
export function calculateOutstandingPayableForBill(
  bill: Transaction,
  allPayments: Transaction[],
  asOfDate?: string
): string {
  if (bill.status === "voided" || bill.type !== "SUPPLIER_BILL") {
    return "0.00";
  }

  let remaining = new Decimal(bill.amount);

  const linkedPayments = allPayments.filter(
    (tx) =>
      tx.status === "active" &&
      tx.type === "SUPPLIER_PAYMENT" &&
      tx.related_transaction_id === bill.id &&
      (!asOfDate || tx.transaction_date <= asOfDate)
  );

  for (const p of linkedPayments) {
    remaining = remaining.minus(new Decimal(p.amount));
  }

  return remaining.isNegative() ? "0.00" : remaining.toFixed(2);
}

export interface ComputeDashboardParams {
  transactions: Transaction[];
  period: PeriodType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  currency: string;
  timezone: string;
}

/**
 * Computes deterministic dashboard totals strictly following PRD Section 7.3 definitions.
 */
export function computeDashboardMetrics(
  params: ComputeDashboardParams
): DashboardSummary {
  const { transactions, period, periodStart, periodEnd, currency, timezone } = params;

  // Active records only
  const activeTxs = transactions.filter((tx) => tx.status === "active");

  // 1. Sales Total in Period: Sum of SALE amounts dated in period
  let salesTotal = new Decimal(0);
  for (const tx of activeTxs) {
    if (
      tx.type === "SALE" &&
      tx.transaction_date >= periodStart &&
      tx.transaction_date <= periodEnd
    ) {
      salesTotal = salesTotal.plus(new Decimal(tx.amount));
    }
  }

  // 2. Cash Collected in Period:
  // Amount collected at time of sale for sales in period + later CUSTOMER_PAYMENT records in period
  let cashCollected = new Decimal(0);
  for (const tx of activeTxs) {
    if (
      tx.type === "SALE" &&
      tx.transaction_date >= periodStart &&
      tx.transaction_date <= periodEnd
    ) {
      if (tx.amount_collected_at_sale) {
        cashCollected = cashCollected.plus(new Decimal(tx.amount_collected_at_sale));
      }
    } else if (
      tx.type === "CUSTOMER_PAYMENT" &&
      tx.transaction_date >= periodStart &&
      tx.transaction_date <= periodEnd
    ) {
      cashCollected = cashCollected.plus(new Decimal(tx.amount));
    }
  }

  // 3. Customer Receivables as of Period End:
  // Cumulative outstanding customer dues for all sales on or before periodEnd minus all payments on or before periodEnd
  let customerReceivables = new Decimal(0);
  const salesUpToPeriod = activeTxs.filter(
    (tx) => tx.type === "SALE" && tx.transaction_date <= periodEnd
  );
  for (const sale of salesUpToPeriod) {
    const remaining = calculateOutstandingReceivableForSale(sale, activeTxs, periodEnd);
    customerReceivables = customerReceivables.plus(new Decimal(remaining));
  }

  // 4. Supplier Payables as of Period End:
  // Cumulative outstanding supplier bills on or before periodEnd minus payments on or before periodEnd
  let supplierPayables = new Decimal(0);
  const billsUpToPeriod = activeTxs.filter(
    (tx) => tx.type === "SUPPLIER_BILL" && tx.transaction_date <= periodEnd
  );
  for (const bill of billsUpToPeriod) {
    const remaining = calculateOutstandingPayableForBill(bill, activeTxs, periodEnd);
    supplierPayables = supplierPayables.plus(new Decimal(remaining));
  }

  // 5. Expenses in Period: Sum of recorded EXPENSE transactions dated in period
  // (Supplier payments do NOT increase expenses)
  let expensesTotal = new Decimal(0);
  for (const tx of activeTxs) {
    if (
      tx.type === "EXPENSE" &&
      tx.transaction_date >= periodStart &&
      tx.transaction_date <= periodEnd
    ) {
      expensesTotal = expensesTotal.plus(new Decimal(tx.amount));
    }
  }

  // 6. Estimated Profit:
  // PRD Section 7.3: Incomplete cost data -> default to insufficient_cost_data & null amount
  return {
    period,
    period_start: periodStart,
    period_end: periodEnd,
    business_timezone: timezone,
    currency,
    sales_total: salesTotal.toFixed(2),
    cash_collected_in_period: cashCollected.toFixed(2),
    customer_receivables_as_of_period_end: customerReceivables.toFixed(2),
    supplier_payables_as_of_period_end: supplierPayables.toFixed(2),
    expenses_total: expensesTotal.toFixed(2),
    profit_status: "insufficient_cost_data",
    profit_amount: null,
  };
}
