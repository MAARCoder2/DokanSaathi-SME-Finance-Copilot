"use client";

import { useState } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DraftTransaction, TransactionType, TRANSACTION_TYPES } from "@/types";

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
  const [amountCollected, setAmountCollected] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState("general");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive total amount.");
      return;
    }

    let collectedStr: string | null = null;
    if (transactionType === "SALE") {
      if (amountCollected.trim() !== "") {
        const parsedCollected = parseFloat(amountCollected);
        if (isNaN(parsedCollected) || parsedCollected < 0) {
          setError("Amount collected at sale must be a non-negative number.");
          return;
        }
        if (parsedCollected > parsedAmount) {
          setError("Amount collected at sale cannot exceed the total sale amount.");
          return;
        }
        collectedStr = parsedCollected.toFixed(2);
      } else {
        // Default to fully collected if blank
        collectedStr = parsedAmount.toFixed(2);
      }
    }

    const draft: DraftTransaction = {
      draft_id: `man-${Date.now()}`,
      transaction_type: transactionType,
      amount: parsedAmount.toFixed(2),
      currency: businessCurrency,
      currency_mentioned_by_user: null,
      amount_collected_at_sale: collectedStr,
      transaction_date: transactionDate,
      counterparty_name: counterpartyName.trim() || null,
      related_transaction_id: null,
      due_date: null,
      category: transactionType === "EXPENSE" ? category : null,
      note: note.trim() || (transactionType === "EXPENSE" ? `Category: ${category}` : null),
      needs_clarification: false,
      clarification_reason: null,
    };

    onDraftCreated(draft);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-6 bg-card rounded-xl border">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-md text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Transaction Type <span className="text-red-500">*</span>
          </label>
          <select
            value={transactionType}
            onChange={(e) => {
              const newType = e.target.value as TransactionType;
              setTransactionType(newType);
              if (newType !== "SALE") {
                setAmountCollected("");
              }
            }}
            disabled={disabled}
            className="w-full h-10 px-3 border rounded-md bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            Total Amount ({businessCurrency}) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1500.00"
            disabled={disabled}
          />
        </div>

        {transactionType === "SALE" && (
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-foreground">
              Cash Collected at Sale ({businessCurrency})
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amountCollected}
              onChange={(e) => setAmountCollected(e.target.value)}
              placeholder="Defaults to full amount if empty"
              disabled={disabled}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              If partial payment, the remainder will be tracked as customer due.
            </p>
          </div>
        )}

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

        <div>
          <label className="text-xs font-semibold block mb-1.5 text-foreground">
            {transactionType === "CUSTOMER_PAYMENT"
              ? "Customer Name *"
              : transactionType === "SUPPLIER_BILL" || transactionType === "SUPPLIER_PAYMENT"
              ? "Supplier Name *"
              : "Counterparty Name (Optional)"}
          </label>
          <Input
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="e.g. Rahim, Meghna Wholesalers"
            disabled={disabled}
          />
        </div>

        {transactionType === "EXPENSE" && (
          <div>
            <label className="text-xs font-semibold block mb-1.5 text-foreground">
              Expense Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={disabled}
              className="w-full h-10 px-3 border rounded-md bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
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

        <div className="md:col-span-2">
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
