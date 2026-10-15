import { NextRequest, NextResponse } from "next/server";
import { getExtractionProvider } from "@/lib/ai/adapter";
import { verifyBusinessOwnership } from "@/lib/auth/guard";

/**
 * POST /api/transactions/extract
 * Extracts candidate financial facts from English natural-language text.
 * Strictly creates a draft in memory ONLY. Never writes to database.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyBusinessOwnership();
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.code, message: authResult.message },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const rawInput = body.raw_input || body.raw_text;

    if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Please provide a statement describing the transaction." },
        { status: 400 }
      );
    }

    const business = authResult.business;
    const provider = getExtractionProvider();

    const draftPayload = await provider.extractDraft(rawInput.trim(), {
      currency: business.currency,
      timezone: business.timezone,
    });

    const primaryDraft = draftPayload.draft_transactions?.[0] || null;
    const needsClarification = Boolean(primaryDraft?.needs_clarification);

    return NextResponse.json(
      {
        ...draftPayload,
        status: needsClarification ? "needs_clarification" : "ready_for_review",
        draft: primaryDraft,
        clarification_question: primaryDraft?.clarification_reason || null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to extract transaction draft.";
    return NextResponse.json(
      { error: "AI_EXTRACTION_FAILED", message },
      { status: 500 }
    );
  }
}
