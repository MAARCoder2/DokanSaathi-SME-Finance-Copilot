import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a server-side Supabase client with authenticated user context.
 * Gracefully handles non-Next.js test contexts where cookies() is outside requestAsyncStorage.
 */
export async function createServerSupabaseClient() {
  let cookieStore: { getAll: () => { name: string; value: string }[]; set: (name: string, value: string, options: any) => void } | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Expected in Vitest environment when route handlers are invoked directly
    cookieStore = null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-dokansaathi.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore!.set(name, value, options);
          });
        } catch {
          // Ignored when called from Server Component
        }
      },
    },
  });
}
