import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyBusinessOwnership } from "@/lib/auth/guard";
import { getMockTransactionsStore } from "@/lib/transactions/mock-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: transactionId } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json(
        { error: "A valid explanation reason is required to void a financial transaction." },
        { status: 400 }
      );
    }

    const authResult = await verifyBusinessOwnership();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.message, code: authResult.code },
        { status: authResult.status }
      );
    }

    const { business, userId } = authResult;
    const isPlaceholderUrl =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

    if (isPlaceholderUrl) {
      const mockStore = getMockTransactionsStore();
      const mockTx = mockStore.find(
        (t) => t.id === transactionId && t.business_id === business.id
      );

      if (!mockTx) {
        return NextResponse.json(
          { error: "Transaction not found or does not belong to this business." },
          { status: 404 }
        );
      }

      if (mockTx.status === "voided") {
        return NextResponse.json(
          { error: "This transaction is already voided." },
          { status: 400 }
        );
      }

      mockTx.status = "voided";
      mockTx.updated_at = new Date().toISOString();

      return NextResponse.json({
        message: "Transaction successfully voided and marked inactive.",
        transaction: mockTx,
        audit_event: {
          transaction_id: mockTx.id,
          event_type: "void",
          actor_id: userId,
          metadata: { reason, voided_at: new Date().toISOString() },
        },
      });
    }

    const supabase = await createServerSupabaseClient();

    // 1. Check transaction exists and belongs to this business
    const { data: existingTx, error: findError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (findError || !existingTx) {
      return NextResponse.json(
        { error: "Transaction not found or does not belong to this business." },
        { status: 404 }
      );
    }

    if (existingTx.status === "voided") {
      return NextResponse.json(
        { error: "This transaction has already been voided." },
        { status: 400 }
      );
    }

    // 2. Perform audited soft-delete (physical deletes are blocked by RLS policies)
    const { data: updatedTx, error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "voided",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .eq("business_id", business.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to void transaction: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 3. Write mandatory audit log
    await supabase.from("transaction_audit_events").insert({
      transaction_id: transactionId,
      business_id: business.id,
      event_type: "void",
      actor_id: userId,
      metadata: {
        reason,
        voided_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      message: "Transaction successfully voided and excluded from ledger totals.",
      transaction: updatedTx,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error voiding transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
