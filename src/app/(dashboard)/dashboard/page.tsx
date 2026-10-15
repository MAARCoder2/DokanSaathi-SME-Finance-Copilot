"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  HelpCircle,
  PlusCircle,
  FileCheck2,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSummary, PeriodType } from "@/types";

interface ExplainModalContent {
  title: string;
  explanation: string;
  formula: string;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [periodBoundaries, setPeriodBoundaries] = useState<{
    startDate: string;
    endDate: string;
    formattedRange: string;
  } | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    currency: string;
    timezone: string;
  }>({ name: "My Shop", currency: "BDT", timezone: "Asia/Dhaka" });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeExplain, setActiveExplain] = useState<ExplainModalContent | null>(null);

  const fetchDashboardData = async (selectedPeriod: PeriodType) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?period=${selectedPeriod}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load dashboard data.");

      setData(json.metrics);
      setPeriodBoundaries(json.boundaries);
      if (json.business) setBusinessInfo(json.business);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error fetching dashboard.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(period);
  }, [period]);

  const explanations: Record<string, ExplainModalContent> = {
    sales: {
      title: "Total Sales in Period",
      explanation:
        "The total value of all goods or services sold within this specific period. This includes both the cash collected upfront and any amounts the customer still owes on credit.",
      formula: "Sum of all SALE transactions dated within the selected period boundaries.",
    },
    cash_collected: {
      title: "Cash Collected in Period",
      explanation:
        "Actual money collected in your shop during this period. This comprises cash paid at the time of sale plus later customer payments received for earlier credit sales.",
      formula:
        "Cash collected at sale for sales in period + later CUSTOMER_PAYMENT records dated in period.",
    },
    receivables: {
      title: "Customer Receivables (Due)",
      explanation:
        "The cumulative unpaid balance owed to you by customers across all past credit sales up to the end of this period. This is an outstanding balance, not a period revenue flow.",
      formula:
        "Cumulative total of all credit sales minus customer payments received on or before period end.",
    },
    payables: {
      title: "Supplier Payables (Due)",
      explanation:
        "The cumulative unpaid balance you owe to suppliers for wholesale goods or materials up to the end of this period. When you record a supplier payment, it reduces this payable without creating an expense.",
      formula:
        "Cumulative total of all supplier bills minus supplier payments made on or before period end.",
    },
    expenses: {
      title: "Operating Expenses in Period",
      explanation:
        "Shop operating costs such as rent, electricity, transport, wages, and maintenance recorded in this period. Payments made against supplier bills are excluded to avoid double-counting.",
      formula: "Sum of all EXPENSE transactions dated within the selected period boundaries.",
    },
    profit: {
      title: "Estimated Profit Status",
      explanation:
        "To protect the accuracy of your financial decisions, DokanSaathi only calculates profit when complete item cost data is recorded. When wholesale purchase costs are unassigned or incomplete, profit is withheld.",
      formula:
        "Status: 'insufficient_cost_data'. DokanSaathi does not invent estimated figures.",
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Business & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Financial Summary
            </h1>
            <Badge variant="outline" className="text-xs">
              {businessInfo.timezone}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {periodBoundaries
              ? `Period: ${periodBoundaries.formattedRange} (${periodBoundaries.startDate} to ${periodBoundaries.endDate})`
              : "Review your shop's revenue, cash collections, and balances."}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <TabsList className="grid grid-cols-3 w-64">
              <TabsTrigger value="daily" className="text-xs">
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(period)}
            disabled={isLoading}
            className="h-9"
            title="Refresh Totals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs md:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium text-foreground">Computing deterministic ledger totals...</p>
        </div>
      )}

      {/* Metric Cards Grid */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Total Sales */}
          <Card className="border-t-4 border-t-emerald-500 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Sales in Period
                </span>
                <CardTitle className="text-2xl font-black text-foreground pt-1">
                  {data.currency} {parseFloat(data.sales_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.sales)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain sales calculation"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Total goods & services sold during this {period} period.
              </p>
            </CardContent>
          </Card>

          {/* 2. Cash Collected */}
          <Card className="border-t-4 border-t-sky-500 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Cash Collected
                </span>
                <CardTitle className="text-2xl font-black text-foreground pt-1">
                  {data.currency} {parseFloat(data.cash_collected_in_period).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.cash_collected)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain cash collected calculation"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Upfront sale cash + customer due payments received.
              </p>
            </CardContent>
          </Card>

          {/* 3. Customer Receivables */}
          <Card className="border-t-4 border-t-amber-500 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Customer Due (Receivable)
                </span>
                <CardTitle className="text-2xl font-black text-amber-700 dark:text-amber-400 pt-1">
                  {data.currency} {parseFloat(data.customer_receivables_as_of_period_end).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.receivables)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain customer receivables calculation"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Cumulative unpaid customer credit as of period end.
              </p>
            </CardContent>
          </Card>

          {/* 4. Supplier Payables */}
          <Card className="border-t-4 border-t-indigo-500 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Supplier Due (Payable)
                </span>
                <CardTitle className="text-2xl font-black text-indigo-700 dark:text-indigo-400 pt-1">
                  {data.currency} {parseFloat(data.supplier_payables_as_of_period_end).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.payables)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain supplier payables calculation"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Cumulative unpaid supplier bills as of period end.
              </p>
            </CardContent>
          </Card>

          {/* 5. Shop Expenses */}
          <Card className="border-t-4 border-t-rose-500 shadow-xs hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Operating Expenses
                </span>
                <CardTitle className="text-2xl font-black text-foreground pt-1">
                  {data.currency} {parseFloat(data.expenses_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.expenses)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain expenses calculation"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Rent, utilities, wages, transport in this period.
              </p>
            </CardContent>
          </Card>

          {/* 6. Estimated Profit (Withheld when cost data incomplete) */}
          <Card className="border-t-4 border-t-slate-400 shadow-xs bg-muted/20">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Estimated Profit
                </span>
                <div className="pt-1.5 flex items-center space-x-2">
                  <Badge variant="outline" className="text-muted-foreground border-dashed text-xs">
                    Unavailable
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(explanations.profit)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Explain why profit is unavailable"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-tight">
                Withheld: cost data is incomplete. DokanSaathi does not invent estimated figures.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Underlying Ledger Drill-down Link & Readiness Prompt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Link
          href="/transactions"
          className="p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                Inspect Underlying Ledger Records
              </span>
              <span className="text-xs text-muted-foreground">
                View the individual verified entries behind these totals.
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/readiness"
          className="p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors flex items-center justify-between group shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                Financing Record Readiness Checklist
              </span>
              <span className="text-xs text-muted-foreground">
                Check documentation status for loan and credit applications.
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* "What This Means" Explanatory Modal */}
      {activeExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl max-w-md w-full p-5 border shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-base text-foreground">{activeExplain.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveExplain(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>{activeExplain.explanation}</p>
              <div className="p-2.5 rounded-md bg-muted/50 border text-[11px] font-mono">
                <span className="font-semibold block text-foreground mb-0.5">Calculation Rule:</span>
                {activeExplain.formula}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" onClick={() => setActiveExplain(null)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
