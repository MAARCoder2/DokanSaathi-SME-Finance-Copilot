import { createServerSupabaseClient } from "../supabase/server";
import { Business } from "../../types";

export interface AuthGuardSuccess {
  authorized: true;
  userId: string;
  business: Business;
}

export interface AuthGuardFailure {
  authorized: false;
  status: 401 | 403 | 404;
  code: "AUTH_REQUIRED" | "ACCESS_DENIED" | "NOT_FOUND";
  message: string;
}

export type AuthGuardResult = AuthGuardSuccess | AuthGuardFailure;

/**
 * Server-side security guard enforcing session authentication and business ownership.
 * Must be called by all protected API routes before accessing or mutating financial records.
 */
export async function verifyBusinessOwnership(
  requestedBusinessId?: string
): Promise<AuthGuardResult> {
  const isPlaceholderUrl =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");
  const isTestOrDemo =
    process.env.NODE_ENV === "test" ||
    process.env.AI_PROVIDER === "mock" ||
    isPlaceholderUrl;

  // In test/demo mode with placeholder credentials, avoid hanging external network requests
  if (isTestOrDemo && isPlaceholderUrl) {
    return {
      authorized: true,
      userId: "demo-user-id",
      business: {
        id: requestedBusinessId || "demo-business-id",
        owner_id: "demo-user-id",
        name: "Demo Retail Shop",
        business_type: "Grocery / General Store",
        currency: "BDT",
        timezone: "Asia/Dhaka",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      status: 401,
      code: "AUTH_REQUIRED",
      message: "You must be signed in to access business financial records.",
    };
  }

  // If a specific business ID is requested, verify the user owns it
  if (requestedBusinessId) {
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", requestedBusinessId)
      .single();

    if (bizError || !business) {
      return {
        authorized: false,
        status: 404,
        code: "NOT_FOUND",
        message: "The requested business was not found.",
      };
    }

    if (business.owner_id !== user.id) {
      return {
        authorized: false,
        status: 403,
        code: "ACCESS_DENIED",
        message: "You do not have permission to access records for this business.",
      };
    }

    return {
      authorized: true,
      userId: user.id,
      business,
    };
  }

  // Otherwise, retrieve the first business owned by this user
  const { data: businesses, error: listError } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1);

  if (listError || !businesses || businesses.length === 0) {
    return {
      authorized: false,
      status: 404,
      code: "NOT_FOUND",
      message: "No business profile found. Please complete business onboarding.",
    };
  }

  return {
    authorized: true,
    userId: user.id,
    business: businesses[0],
  };
}
