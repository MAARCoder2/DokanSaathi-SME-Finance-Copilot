"use client";

import { useState } from "react";
import { ArrowRight, AlertCircle, Banknote, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DraftTransaction, TransactionType, TRANSACTION_TYPES } from "@/types";
import {
  PaymentStatus,
  computeSalePaymentSplit,
  validateManualFormInput,
} from "@/lib/finance/manual-form";

interface ManualTransactionFormProps {
  businessCurrency?: string;
  onDraftCreated: (draft: DraftTransaction) => void;
  disabled?: boolean;
}

export function ManualTransactionForm({
  businessCurrency = "BDT",
  onDraftCreated,
  disabled = false,
}: ManualTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>("SALE");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("fully_paid");
  const [amountCollectedInput, setAmountCollectedInput] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("Rent");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Live calculation for SALE breakdown
  const splitResult =
    transactionType === "SALE" && amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? computeSalePaymentSplit(amount, paymentStatus, amountCollectedInput)
      : null;

  const currentDue = splitResult?.isValid ? splitResult.customerDue || "0.00" : "0.00";
  const hasCustomerDue = Number(currentDue) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateManualFormInput({
      transactionType,
      amount,
      paymentStatus,
      amountCollectedInput,
      counterpartyName,
      transactionDate,
      category,
      note,
      currency: businessCurrency,
    });

    if (!validation.isValid || !validation.draft) {
      setError(validation.error || "Please check the entered values.");
      return;
    }

    onDraftCreated(validation.draft);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6 bg-card rounded-2xl border shadow-xs">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transaction Type */}
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Transaction Type <span className="text-red-500">*</span>
          </label>
          <select
            value={transactionType}
            onChange={(e) => {
              const newType = e.target.value as TransactionType;
              setTransactionType(newType);
              setError(null);
            }}
            disabled={disabled}
            className="w-full h-10 px-3 border rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "SALE"
                  ? "Sale (Goods Sold)"
                  : type === "CUSTOMER_PAYMENT"
                  ? "Customer Payment Received"
                  : type === "SUPPLIER_BILL"
                  ? "Supplier Bill Received"
                  : type === "SUPPLIER_PAYMENT"
                  ? "Supplier Payment Paid"
                  : "Shop Expense"}
              </option>
            ))}
          </select>
        </div>

        {/* Total Amount with Currency Prefix */}
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Total Amount ({businessCurrency}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">
              ৳
            </span>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              disabled={disabled}
              className="pl-7"
            />
          </div>
        </div>

        {/* SALE SPECIFIC: Payment Status Radio Selection */}
        {transactionType === "SALE" && (
          <div className="md:col-span-2 space-y-3 bg-muted/30 p-3.5 sm:p-4 rounded-xl border border-border/60">
            <div>
              <label className="text-xs font-semibold block mb-2 text-foreground">
                Payment Collection Status <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus("fully_paid")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentStatus === "fully_paid"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Fully Paid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus("partially_paid")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentStatus === "partially_paid"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Partially Paid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus("unpaid")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentStatus === "unpaid"
                      ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                      : "bg-background text-muted-foreground hover:bg-muted border-border"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Full Due (Unpaid)</span>
                </button>
              </div>
            </div>

            {/* If partially paid, enter collected amount */}
            {paymentStatus === "partially_paid" && (
              <div className="pt-1">
                <label className="text-xs font-semibold block mb-1.5 text-foreground">
                  Cash Collected at Sale ({businessCurrency}) <span className="text-red-500">*</span>
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amountCollectedInput}
                    onChange={(e) => {
                      setAmountCollectedInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter cash received"
                    disabled={disabled}
                    className="pl-7"
                  />
                </div>
              </div>
            )}

            {/* Real-time Payment Breakdown Summary */}
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-background rounded-lg border">
                  <span className="text-[10px] text-muted-foreground block font-medium">Total Sale</span>
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    ৳ {Number(amount).toFixed(2)}
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">Cash Collected</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-200">
                    ৳ {splitResult?.isValid ? splitResult.amountCollected : "0.00"}
                  </span>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900">
                  <span className="text-[10px] text-rose-800 dark:text-rose-300 block font-medium">Customer Due</span>
                  <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-200">
                    ৳ {currentDue}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Counterparty Name */}
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            {transactionType === "CUSTOMER_PAYMENT"
              ? "Customer Name *"
              : transactionType === "SUPPLIER_BILL" || transactionType === "SUPPLIER_PAYMENT"
              ? "Supplier Name *"
              : hasCustomerDue
              ? "Customer Name * (Required for Due)"
              : "Customer Name (Optional)"}
          </label>
          <Input
            value={counterpartyName}
            onChange={(e) => {
              setCounterpartyName(e.target.value);
              setError(null);
            }}
            placeholder={
              transactionType === "CUSTOMER_PAYMENT" || hasCustomerDue
                ? "e.g. Rahim, Faruk"
                : transactionType === "SUPPLIER_BILL" || transactionType === "SUPPLIER_PAYMENT"
                ? "e.g. Meghna Wholesalers"
                : "e.g. Rahim (Optional)"
            }
            disabled={disabled}
          />
          {hasCustomerDue && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
              Customer name is required to track this outstanding due in ledger.
            </p>
          )}
        </div>

        {/* Transaction Date */}
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Transaction Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            required
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Expense Category (Only if EXPENSE) */}
        {transactionType === "EXPENSE" && (
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-foreground">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={disabled}
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="Rent">Rent</option>
              <option value="Electricity / Utilities">Electricity / Utilities</option>
              <option value="Transportation">Transportation</option>
              <option value="Staff Wages">Staff Wages</option>
              <option value="Packaging">Packaging</option>
              <option value="Tea / Hospitality">Tea / Hospitality</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other Expense">Other Expense</option>
            </select>
          </div>
        )}

        {/* Note / Description */}
        <div className={transactionType === "EXPENSE" ? "md:col-span-2" : "md:col-span-2"}>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Note / Description (Optional)
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Item details, invoice number, or specific comments"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          disabled={disabled || !amount}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
        >
          <span>Review Draft</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
