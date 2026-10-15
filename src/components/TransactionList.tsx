"use client";

import { useState } from "react";
import {
  Ban,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  CreditCard,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Transaction, TransactionType } from "@/types";

interface TransactionListProps {
  transactions: Transaction[];
  businessCurrency: string;
  onTransactionVoided: (voidedId: string) => void;
}

export function TransactionList({
  transactions,
  businessCurrency,
  onTransactionVoided,
}: TransactionListProps) {
  const [selectedTxForVoid, setSelectedTxForVoid] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const handleOpenVoidModal = (tx: Transaction) => {
    setSelectedTxForVoid(tx);
    setVoidReason("");
    setVoidError(null);
  };

  const handleCloseVoidModal = () => {
    setSelectedTxForVoid(null);
    setVoidReason("");
    setVoidError(null);
  };

  const handleConfirmVoid = async () => {
    if (!selectedTxForVoid) return;
    if (!voidReason.trim()) {
      setVoidError("Please provide an audit reason for voiding this transaction.");
      return;
    }

    setIsSubmittingVoid(true);
    setVoidError(null);

    try {
      const res = await fetch(`/api/transactions/${selectedTxForVoid.id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to void transaction.");
      }

      onTransactionVoided(selectedTxForVoid.id);
      handleCloseVoidModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error voiding transaction.";
      setVoidError(message);
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  const getTypeBadgeVariant = (type: TransactionType) => {
    switch (type) {
      case "SALE":
        return "sale";
      case "CUSTOMER_PAYMENT":
        return "payment";
      case "SUPPLIER_BILL":
        return "bill";
      case "SUPPLIER_PAYMENT":
        return "default";
      case "EXPENSE":
        return "expense";
      default:
        return "outline";
    }
  };

  const getBorderColorForType = (type: TransactionType) => {
    switch (type) {
      case "SALE":
        return "border-l-emerald-500";
      case "CUSTOMER_PAYMENT":
        return "border-l-sky-500";
      case "SUPPLIER_BILL":
        return "border-l-amber-500";
      case "SUPPLIER_PAYMENT":
        return "border-l-indigo-500";
      case "EXPENSE":
        return "border-l-rose-500";
      default:
        return "border-l-muted";
    }
  };

  return (
    <div className="space-y-4">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Party / Notes</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Cash / Due</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx) => {
              const amountNum = parseFloat(tx.amount) || 0;
              const collectedNum = tx.amount_collected_at_sale ? parseFloat(tx.amount_collected_at_sale) : null;
              const customerDue = collectedNum !== null ? amountNum - collectedNum : null;

              return (
                <tr
                  key={tx.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    tx.status === "voided" ? "opacity-60 bg-muted/10 line-through-text" : ""
                  }`}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-xs">
                    {tx.transaction_date}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant={getTypeBadgeVariant(tx.type)}>
                      {tx.type.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-foreground truncate">
                      {tx.counterparty_name || "General"}
                    </div>
                    {tx.note && (
                      <div className="text-xs text-muted-foreground truncate">{tx.note}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold">
                    {tx.currency} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap text-xs">
                    {tx.type === "SALE" && collectedNum !== null ? (
                      <div className="space-y-0.5">
                        <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                          Cash: {tx.currency} {collectedNum.toFixed(2)}
                        </div>
                        {customerDue !== null && customerDue > 0 && (
                          <div className="text-amber-700 dark:text-amber-400 font-semibold">
                            Due: {tx.currency} {customerDue.toFixed(2)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {tx.status === "voided" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Voided
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {tx.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenVoidModal(tx)}
                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                        title="Void Transaction"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        <span className="text-xs">Void</span>
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (Optimized for screens >= 320px) */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => {
          const amountNum = parseFloat(tx.amount) || 0;
          const collectedNum = tx.amount_collected_at_sale ? parseFloat(tx.amount_collected_at_sale) : null;
          const customerDue = collectedNum !== null ? amountNum - collectedNum : null;

          return (
            <div
              key={tx.id}
              className={`p-3.5 rounded-xl border border-l-4 bg-card shadow-xs space-y-2.5 ${getBorderColorForType(
                tx.type
              )} ${tx.status === "voided" ? "opacity-60 bg-muted/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Badge variant={getTypeBadgeVariant(tx.type)} className="text-[10px]">
                    {tx.type.replace("_", " ")}
                  </Badge>
                  {tx.status === "voided" && (
                    <Badge variant="destructive" className="text-[10px]">
                      Voided
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {tx.transaction_date}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div className="space-y-0.5 max-w-[60%]">
                  <span className="font-bold text-sm text-foreground block truncate">
                    {tx.counterparty_name || "General Customer / Supplier"}
                  </span>
                  {tx.note && (
                    <span className="text-xs text-muted-foreground block truncate">{tx.note}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-foreground tracking-tight block">
                    {tx.currency} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {tx.type === "SALE" && collectedNum !== null && (
                <div className="p-2 rounded-md bg-muted/40 text-xs flex justify-between items-center">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Cash: {tx.currency} {collectedNum.toFixed(2)}
                  </span>
                  {customerDue !== null && customerDue > 0 && (
                    <span className="text-amber-700 dark:text-amber-400 font-bold">
                      Due: {tx.currency} {customerDue.toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {tx.status === "active" && (
                <div className="pt-1 flex justify-end border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenVoidModal(tx)}
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Void Record
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accessible Void Confirmation Modal */}
      {selectedTxForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl max-w-md w-full p-5 border shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h3 className="font-bold text-base text-foreground">Void Financial Transaction</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseVoidModal}
                disabled={isSubmittingVoid}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Voiding marks this {selectedTxForVoid.type.replace("_", " ")} of{" "}
              <strong className="text-foreground">
                {selectedTxForVoid.currency} {parseFloat(selectedTxForVoid.amount).toFixed(2)}
              </strong>{" "}
              as inactive. It will be permanently excluded from dashboard and ledger totals. An audit
              record will be created.
            </p>

            {voidError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs">
                {voidError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Audit Reason for Voiding <span className="text-red-500">*</span>
              </label>
              <Input
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g., Duplicate entry, customer cancelled, wrong amount"
                disabled={isSubmittingVoid}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseVoidModal}
                disabled={isSubmittingVoid}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmVoid}
                disabled={isSubmittingVoid || !voidReason.trim()}
              >
                {isSubmittingVoid ? "Voiding..." : "Confirm Void"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
