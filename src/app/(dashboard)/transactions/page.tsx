"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  Receipt,
  RefreshCw,
  AlertCircle,
  X,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TransactionList } from "@/components/TransactionList";
import { Transaction, TransactionType, TRANSACTION_TYPES } from "@/types";

function TransactionsLedgerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Query parameter state from URL
  const queryType = searchParams.get("type") || "ALL";
  const queryView = searchParams.get("view") || "";
  const queryStart = searchParams.get("start") || "";
  const queryEnd = searchParams.get("end") || "";
  const queryAsOf = searchParams.get("asOf") || "";
  const queryUnpaid = searchParams.get("unpaid") === "true";
  const queryStatus = (searchParams.get("status") as "active" | "all") || "active";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessCurrency, setBusinessCurrency] = useState("BDT");

  // Local interactive filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>(queryType);
  const [statusFilter, setStatusFilter] = useState<"active" | "all">(queryStatus);

  // Sync state when URL params change
  useEffect(() => {
    setSelectedType(queryType);
    setStatusFilter(queryStatus);
  }, [queryType, queryStatus]);

  const hasActiveDrillDown =
    queryType !== "ALL" ||
    Boolean(queryView) ||
    Boolean(queryStart) ||
    Boolean(queryEnd) ||
    Boolean(queryAsOf) ||
    queryUnpaid;

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (selectedType !== "ALL") params.append("type", selectedType);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      // Propagate dashboard drill-downs if present
      if (queryView) params.append("view", queryView);
      if (queryStart) params.append("start", queryStart);
      if (queryEnd) params.append("end", queryEnd);
      if (queryAsOf) params.append("asOf", queryAsOf);
      if (queryUnpaid) params.append("unpaid", "true");

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
  }, [selectedType, statusFilter, queryView, queryStart, queryEnd, queryAsOf, queryUnpaid]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedType("ALL");
    setStatusFilter("active");
    router.push("/transactions");
  };

  const handleTransactionVoided = (voidedId: string) => {
    if (statusFilter === "active") {
      setTransactions((prev) => prev.filter((t) => t.id !== voidedId));
    } else {
      setTransactions((prev) =>
        prev.map((t) => (t.id === voidedId ? { ...t, status: "voided" } : t))
      );
    }
  };

  // Generate human description of active filter
  const getFilterDescription = () => {
    if (queryView === "cash_collected") {
      return `Cash Inflow (Sales Cash + Customer Due Payments) ${
        queryStart && queryEnd ? `· ${queryStart} to ${queryEnd}` : ""
      }`;
    }
    if (queryUnpaid && queryAsOf) {
      return `Unpaid Receivables & Dues as of ${queryAsOf}`;
    }
    if (queryType !== "ALL") {
      return `${queryType.replace("_", " ")} records ${
        queryStart && queryEnd ? `· ${queryStart} to ${queryEnd}` : ""
      }`;
    }
    if (queryStart && queryEnd) {
      return `Period: ${queryStart} to ${queryEnd}`;
    }
    return "Custom Filter Active";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Financial Ledger
            </h1>
            <Badge variant="outline" className="text-xs font-semibold">
              {transactions.length} Records
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Verified, auditable entries of all business sales, collections, bills, and expenses.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={isLoading}
            className="h-10 px-3"
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

      {/* Active Drill-Down Banner */}
      {hasActiveDrillDown && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-foreground">
              {getFilterDescription()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 text-xs px-2 hover:bg-primary/20 text-primary"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}

      {/* Filter and Search Bar (320px+ Responsive Layout) */}
      <div className="p-3.5 bg-card rounded-2xl border space-y-3 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2.5">
          {/* Full-width search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search counterparty or note..."
              className="pl-9 h-10 bg-background text-sm w-full"
            />
          </div>

          {/* Responsive 2-column filter controls (prevents 320px overflow) */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3 border rounded-lg bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none w-full"
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
              className="h-10 px-3 border rounded-lg bg-background text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none w-full"
            >
              <option value="active">Active Only</option>
              <option value="all">Include Voided</option>
            </select>

            <Button
              type="submit"
              variant="secondary"
              className="col-span-2 sm:col-span-1 h-10 text-xs sm:text-sm font-semibold px-4 w-full sm:w-auto"
            >
              Filter Records
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
        <div className="p-12 text-center space-y-3 bg-card rounded-2xl border">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Loading verified ledger records...</p>
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
              {hasActiveDrillDown || searchQuery || selectedType !== "ALL"
                ? "No ledger records match the selected filter criteria."
                : "No financial entries have been recorded yet."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {hasActiveDrillDown && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Active Filters
              </Button>
            )}
            <Link href="/transactions/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <PlusCircle className="w-4 h-4 mr-2" />
                Record First Entry
              </Button>
            </Link>
          </div>
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

export default function TransactionsLedgerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center space-y-3 bg-card rounded-2xl border">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Loading financial ledger...</p>
        </div>
      }
    >
      <TransactionsLedgerContent />
    </Suspense>
  );
}
