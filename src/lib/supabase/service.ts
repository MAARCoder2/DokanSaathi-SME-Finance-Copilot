import { createClient } from "@supabase/supabase-js";

/**
 * Creates a server-only Supabase admin client using the privileged service-role key.
 * SECURITY: Never call or import this function in client components or browser code.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: createAdminClient cannot be called in client-side code.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-dokansaathi.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // In local testing/mock environments, return an inert client or warn
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not defined. Using mock fallback client.");
  }

  return createClient(supabaseUrl, serviceRoleKey || "placeholder-service-key", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
