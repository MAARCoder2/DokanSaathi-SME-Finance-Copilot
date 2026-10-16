import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
import { getMockTransactionsStore } from "@/lib/transactions/mock-store";
import { Transaction } from "@/types";

export type ReadinessStatus = "documented" | "needs_attention" | "unverified";
export type SourceProvenance = "User-reported" | "Application record-derived";

export interface ReadinessItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: ReadinessStatus;
  source_provenance: SourceProvenance;
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
    const salesWithDueCount = transactions.filter(
      (t) =>
        t.type === "SALE" &&
        parseFloat(t.amount) - parseFloat(t.amount_collected_at_sale || "0") > 0.001
    ).length;
    const customerPaymentsCount = transactions.filter((t) => t.type === "CUSTOMER_PAYMENT").length;
    const supplierBillsCount = transactions.filter((t) => t.type === "SUPPLIER_BILL").length;
    const supplierPaymentsCount = transactions.filter((t) => t.type === "SUPPLIER_PAYMENT").length;
    const expenseCount = transactions.filter((t) => t.type === "EXPENSE").length;

    // Six Authoritative Evidence-Based Categories
    const items: ReadinessItem[] = [
      {
        id: "readiness-identity-registration",
        category: "Identity & Business Registration",
        title: "Trade License & Owner Registration",
        description: "Municipal trade license or local registration certificate with owner Smart NID.",
        status: "needs_attention",
        source_provenance: "User-reported",
        evidence: `Self-reported: Business registered as "${business.name}". Government registrar API not linked.`,
        recommendation: "Ensure municipal trade license is renewed and Smart NID copy is ready for lender inspection.",
      },
      {
        id: "readiness-bank-account",
        category: "Bank Account Details",
        title: "Commercial Bank or Merchant MFS Account",
        description: "Designated business bank current account or merchant MFS (bKash/Nagad) profile.",
        status: "needs_attention",
        source_provenance: "User-reported",
        evidence: "Self-reported: No direct bank feed or MFS gateway linked. Physical/PDF statements must be provided.",
        recommendation: "Route shop collections through a designated business account separate from personal savings.",
      },
      {
        id: "readiness-sales-history",
        category: "Active Sales History",
        title: "Verified Sales Ledger History",
        description: "Continuous record of everyday retail sales and cash collected at point of sale.",
        status: salesCount > 0 ? "documented" : "needs_attention",
        source_provenance: "Application record-derived",
        evidence:
          salesCount > 0
            ? `${salesCount} active sale records verified in DokanSaathi shop ledger.`
            : "No active sale entries recorded yet in ledger.",
        recommendation:
          salesCount > 0
            ? "Continue recording daily retail sales to establish consistent revenue history."
            : "Record daily cash and credit sales to build verifiable sales volume.",
      },
      {
        id: "readiness-receivables-tracking",
        category: "Receivables / Credit Tracking",
        title: "Customer Credit & Receivables Documentation",
        description: "Auditable tracking of credit sales (bakir khata) and customer repayments.",
        status: salesWithDueCount > 0 || customerPaymentsCount > 0 ? "documented" : "needs_attention",
        source_provenance: "Application record-derived",
        evidence:
          salesWithDueCount > 0 || customerPaymentsCount > 0
            ? `${salesWithDueCount} credit sales and ${customerPaymentsCount} customer repayments tracked in ledger.`
            : "No customer credit sales or repayments recorded yet.",
        recommendation: "Record all partial collections and customer repayments to demonstrate debt recovery velocity.",
      },
      {
        id: "readiness-supplier-payables",
        category: "Supplier Payables Tracking",
        title: "Supplier Invoices & Purchase Verification",
        description: "Recorded supplier invoices for inventory and verified supplier payments.",
        status: supplierBillsCount > 0 || supplierPaymentsCount > 0 ? "documented" : "needs_attention",
        source_provenance: "Application record-derived",
        evidence:
          supplierBillsCount > 0 || supplierPaymentsCount > 0
            ? `${supplierBillsCount} supplier bills and ${supplierPaymentsCount} supplier payments tracked in ledger.`
            : "No supplier purchase bills recorded yet.",
        recommendation: "Record supplier wholesale invoices regularly to substantiate cost of goods sold.",
      },
      {
        id: "readiness-operating-expenses",
        category: "Operating Expense Records",
        title: "Documented Shop Operating Overhead",
        description: "Verified shop operating costs including rent, electricity, transport, wages, and utilities.",
        status: expenseCount > 0 ? "documented" : "needs_attention",
        source_provenance: "Application record-derived",
        evidence:
          expenseCount > 0
            ? `${expenseCount} operating expense entries recorded across shop overhead categories.`
            : "No operating expense records found in ledger.",
        recommendation: "Record ongoing monthly utilities and operating overhead to demonstrate realistic margin management.",
      },
    ];

    const completedCount = items.filter((i) => i.status === "documented").length;
    const readinessPercentage = Math.round((completedCount / items.length) * 100);

    return NextResponse.json({
      items,
      completed_count: completedCount,
      total_count: items.length,
      readiness_percentage: readinessPercentage,
      disclaimer:
        "This checklist helps you prepare your business records. DokanSaathi does not approve loans or guarantee financing. Final decisions are made by financial institutions.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error loading readiness checklist.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
