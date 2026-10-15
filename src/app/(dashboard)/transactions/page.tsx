"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, Search, Filter, Receipt, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TransactionList } from "@/components/TransactionList";
import { Transaction, TransactionType, TRANSACTION_TYPES } from "@/types";

export default function TransactionsLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessCurrency, setBusinessCurrency] = useState("BDT");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "ALL") params.append("type", selectedType);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load transactions.");
      }

      setTransactions(data.transactions || []);
      if (data.business_currency) setBusinessCurrency(data.business_currency);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error fetching transactions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedType, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleTransactionVoided = (voidedId: string) => {
    // If active only, remove from view; else mark voided
    if (statusFilter === "active") {
      setTransactions((prev) => prev.filter((t) => t.id !== voidedId));
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === voidedId ? { ...t, status: "voided" } : t))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Financial Ledger
            </h1>
            <Badge variant="outline" className="text-xs">
              {transactions.length} Records
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Verified, auditable records of all business sales, payments, bills, and expenses.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={isLoading}
            className="h-10"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>

          <Link href="/transactions/new">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-10 px-4">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Record Entry</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-card rounded-xl border space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by counterparty name or note..."
              className="pl-9 h-10 bg-background text-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3 border rounded-md bg-background text-xs md:text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "active" | "all")}
              className="h-10 px-3 border rounded-md bg-background text-xs md:text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="active">Active Only</option>
              <option value="all">Include Voided</option>
            </select>

            <Button type="submit" variant="secondary" className="h-10 text-xs px-3">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-xl text-xs md:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium text-foreground">Loading financial records...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && transactions.length === 0 && (
        <div className="p-12 text-center rounded-2xl border-2 border-dashed bg-card space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Transactions Found</h3>
            <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery || selectedType !== "ALL"
                ? "No transactions match your current search or filter criteria."
                : "You have not recorded any financial entries yet. Record your first sale, supplier payment, or expense."}
            </p>
          </div>
          <Link href="/transactions/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <PlusCircle className="w-4 h-4 mr-2" />
              Record First Entry
            </Button>
          </Link>
        </div>
      )}

      {/* Transaction List */}
      {!isLoading && !error && transactions.length > 0 && (
        <TransactionList
          transactions={transactions}
          businessCurrency={businessCurrency}
          onTransactionVoided={handleTransactionVoided}
        />
      )}
    </div>
  );
}
