import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
import { getMockTransactionsStore } from "@/lib/transactions/mock-store";
import { Transaction } from "@/types";

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
    const fromDate = searchParams.get("start") || searchParams.get("from");
    const toDate = searchParams.get("end") || searchParams.get("to");
    const asOfDate = searchParams.get("asOf");
    const unpaidFilter = searchParams.get("unpaid") === "true";
    const viewFilter = searchParams.get("view");
    const search = searchParams.get("search")?.toLowerCase();

    const isPlaceholderUrl =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let allBusinessTransactions: Transaction[] = [];

    if (isPlaceholderUrl) {
      allBusinessTransactions = [...getMockTransactionsStore()].filter(
        (t) => t.business_id === business.id
      );
    } else {
      const supabase = await createServerSupabaseClient();
      const { data: dbTransactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", business.id)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error || !dbTransactions) {
        allBusinessTransactions = [...getMockTransactionsStore()].filter(
          (t) => t.business_id === business.id
        );
      } else {
        allBusinessTransactions = dbTransactions as Transaction[];
      }
    }

    let filtered = allBusinessTransactions;

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // View filter: cash_collected shows Sales with cash collected + Customer Payments
    if (viewFilter === "cash_collected") {
      filtered = filtered.filter((t) => {
        if (t.type === "CUSTOMER_PAYMENT") return true;
        if (t.type === "SALE") {
          const cash = parseFloat(t.amount_collected_at_sale || "0");
          return cash > 0;
        }
        return false;
      });
    } else if (typeFilter && typeFilter !== "ALL") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Date range filters
    if (fromDate) {
      filtered = filtered.filter((t) => t.transaction_date >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((t) => t.transaction_date <= toDate);
    }

    // asOf period-end balance filters for unpaid receivables / payables
    if (asOfDate) {
      filtered = filtered.filter((t) => t.transaction_date <= asOfDate);

      if (unpaidFilter) {
        const paymentsUpToAsOf = allBusinessTransactions.filter(
          (t) => t.status === "active" && t.transaction_date <= asOfDate
        );

        if (typeFilter === "SALE") {
          filtered = filtered.filter((sale) => {
            const total = parseFloat(sale.amount) || 0;
            const upfront = parseFloat(sale.amount_collected_at_sale || "0") || 0;
            const linkedPayments = paymentsUpToAsOf
              .filter(
                (p) =>
                  p.type === "CUSTOMER_PAYMENT" &&
                  (p.related_transaction_id === sale.id ||
                    (p.counterparty_name &&
                      sale.counterparty_name &&
                      p.counterparty_name.toLowerCase() === sale.counterparty_name.toLowerCase()))
              )
              .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            return total - (upfront + linkedPayments) > 0.001;
          });
        } else if (typeFilter === "SUPPLIER_BILL") {
          filtered = filtered.filter((bill) => {
            const total = parseFloat(bill.amount) || 0;
            const linkedPayments = paymentsUpToAsOf
              .filter(
                (p) =>
                  p.type === "SUPPLIER_PAYMENT" &&
                  (p.related_transaction_id === bill.id ||
                    (p.counterparty_name &&
                      bill.counterparty_name &&
                      p.counterparty_name.toLowerCase() === bill.counterparty_name.toLowerCase()))
              )
              .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            return total - linkedPayments > 0.001;
          });
        }
      }
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error listing transactions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
