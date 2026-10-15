import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
import { getMockTransactionsStore } from "@/lib/transactions/mock-store";
import { Transaction } from "@/types";

export interface ReadinessItem {
  id: string;
  category: "registration" | "bookkeeping" | "credit_records" | "supplier_records" | "identity" | "banking";
  title: string;
  description: string;
  status: "ready" | "needs_attention" | "not_started";
  evidence: string;
  recommendation: string;
}

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
    const isPlaceholderUrl =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    let transactions: Transaction[] = [];

    if (isPlaceholderUrl) {
      transactions = getMockTransactionsStore().filter(
        (t) => t.business_id === business.id && t.status === "active"
      );
    } else {
      const supabase = await createServerSupabaseClient();
      const { data: dbTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("business_id", business.id)
        .eq("status", "active");

      transactions = (dbTransactions as Transaction[]) || [];
    }

    const salesCount = transactions.filter((t) => t.type === "SALE").length;
    const customerPaymentsCount = transactions.filter((t) => t.type === "CUSTOMER_PAYMENT").length;
    const supplierBillsCount = transactions.filter((t) => t.type === "SUPPLIER_BILL").length;
    const expenseCount = transactions.filter((t) => t.type === "EXPENSE").length;

    // Evaluate documented small-business readiness indicators
    const items: ReadinessItem[] = [
      {
        id: "readiness-1",
        category: "registration",
        title: "Trade License & Business Registration",
        description: "Official municipal trade license or local authority registration certificate.",
        status: "needs_attention",
        evidence: "Business profile recorded: " + business.name,
        recommendation: "Ensure your municipal trade license is renewed for the current fiscal year.",
      },
      {
        id: "readiness-2",
        category: "bookkeeping",
        title: "Active Transaction History",
        description: "Documented history of everyday business sales and operating expenses.",
        status: transactions.length >= 4 ? "ready" : "needs_attention",
        evidence: `${transactions.length} active ledger records saved (${salesCount} sales, ${expenseCount} expenses).`,
        recommendation: transactions.length >= 30
          ? "Consistent recordkeeping maintained."
          : "Maintain at least 30 consecutive days of verified transaction entries for lending review.",
      },
      {
        id: "readiness-3",
        category: "credit_records",
        title: "Customer Credit & Receivables Documentation",
        description: "Auditable tracking of credit sales (bakir khata) and customer repayments.",
        status: customerPaymentsCount > 0 ? "ready" : "needs_attention",
        evidence: `${customerPaymentsCount} customer payment records reconciled against customer credit.`,
        recommendation: "Record all partial collections and customer repayments to demonstrate receivables turnaround.",
      },
      {
        id: "readiness-4",
        category: "supplier_records",
        title: "Supplier Invoices & Purchase Verification",
        description: "Recorded supplier invoices and verified supplier payments.",
        status: supplierBillsCount > 0 ? "ready" : "needs_attention",
        evidence: `${supplierBillsCount} supplier bill records recorded in ledger.`,
        recommendation: "Record supplier wholesale invoices consistently to substantiate cost of goods sold.",
      },
      {
        id: "readiness-5",
        category: "identity",
        title: "Owner Identity & KYC Records",
        description: "National ID (NID) card, photograph, and shop utility bill for address proof.",
        status: "ready",
        evidence: "Owner account authenticated.",
        recommendation: "Keep physical and scanned copies of your Smart NID card and recent utility bills ready.",
      },
      {
        id: "readiness-6",
        category: "banking",
        title: "Dedicated Bank or Merchant MFS Account",
        description: "Designated commercial bank current account or merchant MFS (bKash/Nagad) account.",
        status: "needs_attention",
        evidence: "Business currency configured: " + business.currency,
        recommendation: "Conduct business collections through a dedicated merchant or commercial bank account separate from personal funds.",
      },
    ];

    const completedCount = items.filter((i) => i.status === "ready").length;
    const readinessScorePercentage = Math.round((completedCount / items.length) * 100);

    return NextResponse.json({
      items,
      completed_count: completedCount,
      total_count: items.length,
      readiness_percentage: readinessScorePercentage,
      disclaimer:
        "This readiness checklist is an organizational guide to help small businesses prepare their financial records. It does not predict, promise, or guarantee loan approval, credit scoring, or financing eligibility from any bank or financial institution. Lending criteria and approvals are determined solely by authorized financial institutions under their independent credit policies.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error loading readiness checklist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
