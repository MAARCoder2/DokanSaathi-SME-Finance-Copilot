import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
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

    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status") || "active"; // active, voided, or all
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const search = searchParams.get("search")?.toLowerCase();

    const isPlaceholderUrl =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isPlaceholderUrl) {
      let filtered = [...getMockTransactionsStore()].filter(
        (t) => t.business_id === business.id
      );

      if (statusFilter !== "all") {
        filtered = filtered.filter((t) => t.status === statusFilter);
      }
      if (typeFilter) {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }
      if (fromDate) {
        filtered = filtered.filter((t) => t.transaction_date >= fromDate);
      }
      if (toDate) {
        filtered = filtered.filter((t) => t.transaction_date <= toDate);
      }
      if (search) {
        filtered = filtered.filter(
          (t) =>
            t.counterparty_name?.toLowerCase().includes(search) ||
            t.note?.toLowerCase().includes(search)
        );
      }

      return NextResponse.json({
        transactions: filtered,
        total: filtered.length,
        business_currency: business.currency,
      });
    }

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from("transactions")
      .select("*")
      .eq("business_id", business.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (typeFilter) {
      query = query.eq("type", typeFilter);
    }

    if (fromDate) {
      query = query.gte("transaction_date", fromDate);
    }

    if (toDate) {
      query = query.lte("transaction_date", toDate);
    }

    const { data: dbTransactions, error } = await query;

    if (error || !dbTransactions) {
      let filtered = [...getMockTransactionsStore()].filter(
        (t) => t.business_id === business.id
      );

      if (statusFilter !== "all") {
        filtered = filtered.filter((t) => t.status === statusFilter);
      }
      if (typeFilter) {
        filtered = filtered.filter((t) => t.type === typeFilter);
      }
      if (fromDate) {
        filtered = filtered.filter((t) => t.transaction_date >= fromDate);
      }
      if (toDate) {
        filtered = filtered.filter((t) => t.transaction_date <= toDate);
      }
      if (search) {
        filtered = filtered.filter(
          (t) =>
            t.counterparty_name?.toLowerCase().includes(search) ||
            t.note?.toLowerCase().includes(search)
        );
      }

      return NextResponse.json({
        transactions: filtered,
        total: filtered.length,
        business_currency: business.currency,
      });
    }

    return NextResponse.json({
      transactions: dbTransactions,
      total: dbTransactions.length,
      business_currency: business.currency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error listing transactions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
