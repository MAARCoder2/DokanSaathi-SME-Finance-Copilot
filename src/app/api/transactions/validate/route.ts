import { NextRequest, NextResponse } from "next/server";
import { validateLedgerDraftPayload } from "@/lib/validation/transaction-schema";
import { verifyBusinessOwnership } from "@/lib/auth/guard";

/**
 * POST /api/transactions/validate
 * Validates draft structure and financial invariants.
 * Does not write to database.
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
    const { draft } = body;

    if (!draft) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Draft payload is required." },
        { status: 400 }
      );
    }

    const business = authResult.business;
    const validationResult = validateLedgerDraftPayload(draft, business.currency);

    return NextResponse.json(validationResult, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: err.message || "Failed to validate draft." },
      { status: 500 }
    );
  }
}
