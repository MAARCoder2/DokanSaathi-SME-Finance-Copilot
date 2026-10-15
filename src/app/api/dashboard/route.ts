import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
import { computeDashboardMetrics } from "@/lib/finance/calculator";
import { getPeriodBoundaries } from "@/lib/finance/periods";
import { PeriodType, Transaction } from "@/types";
import { getMockTransactionsStore } from "@/lib/transactions/mock-store";

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyBusinessOwnership();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { business } = authResult;
    const { searchParams } = new URL(req.url);

    const periodParam = (searchParams.get("period") || "daily") as PeriodType;
    const validPeriods: PeriodType[] = ["daily", "weekly", "monthly"];
    const period = validPeriods.includes(periodParam) ? periodParam : "daily";

    const refDateParam = searchParams.get("date");
    const referenceDate = refDateParam ? new Date(refDateParam) : new Date();

    // 1. Compute strict timezone-aware period boundaries
    const boundaries = getPeriodBoundaries(period, referenceDate, business.timezone);

    // 2. Fetch active business transactions up to period end
    const isPlaceholderUrl =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let activeTransactions: Transaction[] = [];

    if (isPlaceholderUrl) {
      const mockStore = getMockTransactionsStore();
      activeTransactions = mockStore.filter(
        (t) =>
          t.business_id === business.id &&
          t.status === "active" &&
          t.transaction_date <= boundaries.periodEnd
      );
    } else {
      const supabase = await createServerSupabaseClient();
      const { data: dbTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", business.id)
        .eq("status", "active")
        .lte("transaction_date", boundaries.periodEnd);

      activeTransactions = (dbTransactions as Transaction[]) || [];
    }

    // 3. Deterministically compute metrics strictly following PRD Section 7.3
    const metrics = computeDashboardMetrics({
      transactions: activeTransactions,
      period,
      periodStart: boundaries.periodStart,
      periodEnd: boundaries.periodEnd,
      currency: business.currency,
      timezone: business.timezone,
    });

    return NextResponse.json({
      metrics,
      boundaries,
      business: {
        id: business.id,
        name: business.name,
        currency: business.currency,
        timezone: business.timezone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error computing dashboard metrics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
