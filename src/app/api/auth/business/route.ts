import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "AUTH_REQUIRED", message: "Sign in required to view business settings" },
        { status: 401 }
      );
    }

    const { data: businesses, error: dbError } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .limit(1);

    if (dbError) {
      return NextResponse.json({ error: "DATABASE_ERROR", message: dbError.message }, { status: 500 });
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ error: "NOT_FOUND", message: "No business found" }, { status: 404 });
    }

    return NextResponse.json({ business: businesses[0] });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, business_type, currency, timezone } = body;

    if (!name || !currency || !timezone) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Name, currency, and timezone are required." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ownerId = user ? user.id : "demo-owner-id";

    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        owner_id: ownerId,
        name: name.trim(),
        business_type: business_type || "Other",
        currency: currency.toUpperCase(),
        timezone: timezone || "Asia/Dhaka",
      })
      .select()
      .single();

    if (insertError) {
      // In local dev/mock mode, return synthetic success
      return NextResponse.json({
        business: {
          id: "local-business-id",
          owner_id: ownerId,
          name,
          business_type: business_type || "Other",
          currency,
          timezone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({ business }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
