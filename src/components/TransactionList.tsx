"use client";

import { useState, useMemo } from "react";
import {
  Ban,
  Calendar,
  AlertTriangle,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Transaction, TransactionType } from "@/types";
import { formatCalendarDateFull } from "@/lib/finance/periods";

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

  // Group transactions chronologically by calendar date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; formattedDate: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const d = tx.transaction_date;
      if (!map.has(d)) {
        map.set(d, []);
      }
      map.get(d)!.push(tx);
    }

    // Sort dates descending
    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const date of sortedDates) {
      groups.push({
        date,
        formattedDate: formatCalendarDateFull(date),
        items: map.get(date)!,
      });
    }

    return groups;
  }, [transactions]);

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

  const getTypeBadgeStyle = (type: TransactionType) => {
    switch (type) {
      case "SALE":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "CUSTOMER_PAYMENT":
        return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20";
      case "SUPPLIER_BILL":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
      case "SUPPLIER_PAYMENT":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "EXPENSE":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getBorderColorForType = (type: TransactionType) => {
    switch (type) {
      case "SALE":
        return "border-l-emerald-500";
      case "CUSTOMER_PAYMENT":
        return "border-l-sky-500";
      case "SUPPLIER_BILL":
        return "border-l-indigo-500";
      case "SUPPLIER_PAYMENT":
        return "border-l-purple-500";
      case "EXPENSE":
        return "border-l-rose-500";
      default:
        return "border-l-muted";
    }
  };

  return (
    <div className="space-y-6">
      {groupedTransactions.map((group) => (
        <div key={group.date} className="space-y-2.5">
          {/* Chronological Date Header */}
          <div className="sticky top-16 z-20 bg-background/90 backdrop-blur-xs py-1.5 flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {group.formattedDate}
            </h3>
            <span className="text-[11px] text-muted-foreground">({group.items.length})</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border bg-card shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Counterparty / Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Cash / Due Breakdown</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {group.items.map((tx) => {
                  const curr = tx.currency || businessCurrency;
                  const amountNum = parseFloat(tx.amount) || 0;
                  const collectedNum =
                    tx.amount_collected_at_sale !== null
                      ? parseFloat(tx.amount_collected_at_sale)
                      : null;
                  const customerDue = collectedNum !== null ? amountNum - collectedNum : null;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        tx.status === "voided" ? "opacity-60 bg-muted/10 line-through text-muted-foreground" : ""
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className={`text-xs ${getTypeBadgeStyle(tx.type)}`}>
                          {tx.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-foreground truncate">
                          {tx.counterparty_name ||
                            (tx.type === "EXPENSE" ? tx.category || "Shop Expense" : "General Customer")}
                        </div>
                        {tx.note && (
                          <div className="text-xs text-muted-foreground truncate">{tx.note}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-foreground">
                        {curr} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap text-xs">
                        {tx.type === "SALE" && collectedNum !== null ? (
                          <div className="space-y-0.5">
                            <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                              Cash: {curr} {collectedNum.toFixed(2)}
                            </div>
                            {customerDue !== null && customerDue > 0.001 && (
                              <div className="text-rose-700 dark:text-rose-400 font-bold">
                                Due: {curr} {customerDue.toFixed(2)}
                              </div>
                            )}
                          </div>
                        ) : tx.type === "CUSTOMER_PAYMENT" ? (
                          <span className="text-emerald-600 font-medium">Payment Received</span>
                        ) : tx.type === "SUPPLIER_PAYMENT" ? (
                          <span className="text-purple-600 font-medium">Paid to Supplier</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {tx.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenVoidModal(tx)}
                            className="text-muted-foreground hover:text-destructive h-8 px-2"
                            title="Void Transaction"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
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
          <div className="md:hidden space-y-2.5">
            {group.items.map((tx) => {
              const curr = tx.currency || businessCurrency;
              const amountNum = parseFloat(tx.amount) || 0;
              const collectedNum =
                tx.amount_collected_at_sale !== null
                  ? parseFloat(tx.amount_collected_at_sale)
                  : null;
              const customerDue = collectedNum !== null ? amountNum - collectedNum : null;

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-xl border border-l-4 bg-card shadow-xs space-y-2 ${getBorderColorForType(
                    tx.type
                  )} ${tx.status === "voided" ? "opacity-60 bg-muted/10 line-through" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${getTypeBadgeStyle(tx.type)}`}>
                      {tx.type.replace("_", " ")}
                    </Badge>
                    {tx.status === "voided" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Voided
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="space-y-0.5 max-w-[65%]">
                      <span className="font-bold text-sm text-foreground block truncate">
                        {tx.counterparty_name ||
                          (tx.type === "EXPENSE" ? tx.category || "Shop Expense" : "General Customer")}
                      </span>
                      {tx.note && (
                        <span className="text-xs text-muted-foreground block truncate">{tx.note}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-foreground tracking-tight block">
                        {curr} {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {tx.type === "SALE" && collectedNum !== null && (
                    <div className="p-2 rounded-lg bg-muted/40 text-xs flex justify-between items-center">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Cash: {curr} {collectedNum.toFixed(2)}
                      </span>
                      {customerDue !== null && customerDue > 0.001 && (
                        <span className="text-rose-700 dark:text-rose-400 font-bold">
                          Due: {curr} {customerDue.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}

                  {tx.status === "active" && (
                    <div className="pt-1 flex justify-end border-t border-border/40">
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
        </div>
      ))}

      {/* Accessible Void Confirmation Modal */}
      {selectedTxForVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4">
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
                {selectedTxForVoid.currency || businessCurrency} {parseFloat(selectedTxForVoid.amount).toFixed(2)}
              </strong>{" "}
              as inactive. It will be permanently excluded from dashboard totals. An audit
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
