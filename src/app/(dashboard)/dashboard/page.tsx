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
  ChevronRight,
  Mic,
  FileEdit,
  ArrowRight,
  Building2,
  CreditCard,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceCaptureDialog } from "@/components/VoiceCaptureDialog";
import { DashboardSummary, PeriodType, Transaction } from "@/types";

interface ExplainModalContent {
  title: string;
  explanation: string;
  formula: string;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [periodBoundaries, setPeriodBoundaries] = useState<{
    startDate: string;
    endDate: string;
    formattedRange: string;
    label?: string;
  } | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{
    name: string;
    currency: string;
    timezone: string;
  }>({ name: "Brother Rahim's Store", currency: "BDT", timezone: "Asia/Dhaka" });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeExplain, setActiveExplain] = useState<ExplainModalContent | null>(null);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);

  const fetchDashboardData = async (selectedPeriod: PeriodType) => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashRes, txRes] = await Promise.all([
        fetch(`/api/dashboard?period=${selectedPeriod}`),
        fetch("/api/transactions"),
      ]);

      const dashJson = await dashRes.json();
      if (!dashRes.ok) throw new Error(dashJson.error || "Failed to load dashboard data.");

      setData(dashJson.metrics);
      setPeriodBoundaries(dashJson.boundaries);
      if (dashJson.business) setBusinessInfo(dashJson.business);

      if (txRes.ok) {
        const txJson = await txRes.json();
        const txList: Transaction[] = txJson.transactions || [];
        setRecentTransactions(txList.slice(0, 5));
      }
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
      title: "Cash Collected in Period (Inflow)",
      explanation:
        "Actual money collected in your shop during this period. This comprises cash paid at the time of sale plus later customer payments received for earlier credit sales.",
      formula:
        "Cash collected at sale for sales in period + later CUSTOMER_PAYMENT records dated in period.",
    },
    receivables: {
      title: "Customer Due (Receivables as of Period End)",
      explanation:
        "The cumulative unpaid balance owed to you by customers across all past credit sales up to the end of this period. This is an outstanding balance, not a period revenue flow.",
      formula:
        "Cumulative total of all credit sales minus customer payments received on or before period end.",
    },
    supplier_bills: {
      title: "Supplier Bills in Period",
      explanation:
        "Total inventory and wholesale supplies received from suppliers during this period, regardless of whether paid immediately or on supplier credit.",
      formula: "Sum of all SUPPLIER_BILL transactions dated within the selected period boundaries.",
    },
    payables: {
      title: "Supplier Due (Payables as of Period End)",
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
    net_cash: {
      title: "Net Cash Flow in Period",
      explanation:
        "Deterministic net cash remaining after paying operating expenses and supplier payments. This reflects real liquidity change in your shop drawer.",
      formula: "Cash Collected in Period - (Supplier Payments in Period + Operating Expenses)",
    },
  };

  const start = periodBoundaries?.startDate || "";
  const end = periodBoundaries?.endDate || "";

  return (
    <div className="space-y-6">
      {/* Screen 1 Header: Greeting, Shop Name, Timezone Badge & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {businessInfo.name || "DokanSaathi"}
            </h1>
            <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary">
              {businessInfo.currency} (৳) · {businessInfo.timezone}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {periodBoundaries
              ? `${periodBoundaries.formattedRange} · Deterministic Financial Summary`
              : "Review your shop's revenue, cash collections, and balances."}
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <TabsList className="grid grid-cols-3 w-64 bg-muted/60 p-1">
              <TabsTrigger value="daily" className="text-xs font-semibold">
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs font-semibold">
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs font-semibold">
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(period)}
            disabled={isLoading}
            className="h-9 px-3"
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
        <div className="p-12 text-center space-y-3 bg-card rounded-2xl border">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm font-semibold text-foreground">Computing deterministic ledger totals...</p>
        </div>
      )}

      {/* Metric Cards Grid & Net Cash Banner */}
      {!isLoading && data && (
        <div className="space-y-4">
          {/* Net Cash Flow Banner */}
          {data.net_cash_flow !== undefined && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Net Cash Flow in Period
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveExplain(explanations.net_cash)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    ৳ {parseFloat(data.net_cash_flow).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div>
                  Cash In: <span className="font-semibold text-emerald-600">৳ {parseFloat(data.cash_collected_in_period).toFixed(2)}</span>
                </div>
                <div>
                  Cash Out: <span className="font-semibold text-rose-600">
                    ৳ {(parseFloat(data.supplier_payments_in_period || "0") + parseFloat(data.expenses_total)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6 Key Metric Cards with Exact Drill-Down Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Total Sales */}
            <Card className="border-t-4 border-t-emerald-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Total Sales
                  </span>
                  <CardTitle className="text-2xl font-black text-foreground pt-1">
                    ৳ {parseFloat(data.sales_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Cash collected: ৳ {parseFloat(data.sales_cash_collected || data.cash_collected_in_period).toFixed(2)} · Due: ৳ {parseFloat(data.sales_credit_due || "0").toFixed(2)}
                </p>
                <Link
                  href={`/transactions?type=SALE&start=${start}&end=${end}`}
                  className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to sales</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* 2. Cash Collected (Inflow) */}
            <Card className="border-t-4 border-t-sky-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Cash Inflow
                  </span>
                  <CardTitle className="text-2xl font-black text-foreground pt-1">
                    ৳ {parseFloat(data.cash_collected_in_period).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Sales cash + customer due payments received.
                </p>
                <Link
                  href={`/transactions?view=cash_collected&start=${start}&end=${end}`}
                  className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to cash collected</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* 3. Customer Due (Receivables) */}
            <Card className="border-t-4 border-t-amber-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Customer Due
                  </span>
                  <CardTitle className="text-2xl font-black text-amber-700 dark:text-amber-400 pt-1">
                    ৳ {parseFloat(data.customer_receivables_as_of_period_end).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Cumulative unpaid customer credit as of {end}.
                </p>
                <Link
                  href={`/transactions?asOf=${end}&unpaid=true`}
                  className="inline-flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to unpaid customer dues</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* 4. Supplier Bills in Period */}
            <Card className="border-t-4 border-t-indigo-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Supplier Bills
                  </span>
                  <CardTitle className="text-2xl font-black text-indigo-700 dark:text-indigo-400 pt-1">
                    ৳ {parseFloat(data.supplier_bills_total || "0.00").toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveExplain(explanations.supplier_bills)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Explain supplier bills calculation"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Inventory & wholesale supplies received in period.
                </p>
                <Link
                  href={`/transactions?type=SUPPLIER_BILL&start=${start}&end=${end}`}
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to supplier bills</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* 5. Operating Expenses */}
            <Card className="border-t-4 border-t-purple-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Operating Expenses
                  </span>
                  <CardTitle className="text-2xl font-black text-foreground pt-1">
                    ৳ {parseFloat(data.expenses_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Shop rent, electricity, transport & wages.
                </p>
                <Link
                  href={`/transactions?type=EXPENSE&start=${start}&end=${end}`}
                  className="inline-flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to operating expenses</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>

            {/* 6. Supplier Due (Payables) */}
            <Card className="border-t-4 border-t-rose-500 shadow-xs hover:shadow-md transition-all group">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Supplier Due
                  </span>
                  <CardTitle className="text-2xl font-black text-rose-700 dark:text-rose-400 pt-1">
                    ৳ {parseFloat(data.supplier_payables_as_of_period_end).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Cumulative unpaid wholesale dues as of {end}.
                </p>
                <Link
                  href={`/transactions?type=SUPPLIER_BILL&asOf=${end}&unpaid=true`}
                  className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 group-hover:translate-x-0.5 transition-all pt-1"
                >
                  <span>Drill down to unpaid supplier bills</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Quick Action Buttons & Readiness Prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
        <button
          type="button"
          onClick={() => setVoiceDialogOpen(true)}
          className="p-4 rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-left flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100 block">
                Speak Note
              </span>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Voice speech-to-text entry
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
        </button>

        <Link
          href="/transactions/new?tab=manual"
          className="p-4 rounded-xl border bg-card hover:bg-muted/40 text-left flex items-center justify-between group transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                Manual Entry Form
              </span>
              <span className="text-[11px] text-muted-foreground">
                Structured record input
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/readiness"
          className="p-4 rounded-xl border bg-card hover:bg-muted/40 text-left flex items-center justify-between group transition-all sm:col-span-2 md:col-span-1"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">
                Financing Readiness
              </span>
              <span className="text-[11px] text-muted-foreground">
                Audit loan documentation
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Ledger Transactions Preview */}
      <div className="p-4 sm:p-5 bg-card rounded-2xl border space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Recent Verified Transactions</h2>
            <p className="text-xs text-muted-foreground">Last verified entries in your shop ledger</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-primary hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No transactions recorded yet. Tap &ldquo;Speak Note&rdquo; or &ldquo;Manual Entry&rdquo; to start.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {recentTransactions.map((tx) => {
              const isSale = tx.type === "SALE";
              const isCustomerPayment = tx.type === "CUSTOMER_PAYMENT";
              const isBill = tx.type === "SUPPLIER_BILL";
              const isSupplierPayment = tx.type === "SUPPLIER_PAYMENT";
              const isExpense = tx.type === "EXPENSE";

              const badgeColor = isSale
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                : isCustomerPayment
                ? "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                : isBill
                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20"
                : isSupplierPayment
                ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-foreground text-sm">
                        {tx.counterparty_name || (isExpense ? tx.category || "Shop Expense" : "General Customer")}
                      </span>
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${badgeColor}`}>
                        {tx.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      {tx.transaction_date} {tx.note ? `· ${tx.note}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-foreground block">
                      ৳ {parseFloat(tx.amount).toFixed(2)}
                    </span>
                    {isSale && tx.amount_collected_at_sale && (
                      <span className="text-[10px] text-muted-foreground">
                        Collected: ৳ {parseFloat(tx.amount_collected_at_sale).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Voice Capture Dialog Component */}
      <VoiceCaptureDialog
        open={voiceDialogOpen}
        onOpenChange={setVoiceDialogOpen}
      />

      {/* "What This Means" Explanatory Modal */}
      {activeExplain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4">
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
              <div className="p-3 rounded-xl bg-muted/50 border text-[11px] font-mono">
                <span className="font-semibold block text-foreground mb-1">Deterministic Formula:</span>
                {activeExplain.formula}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button size="sm" onClick={() => setActiveExplain(null)} className="font-semibold px-5">
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
