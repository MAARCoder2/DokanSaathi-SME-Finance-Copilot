import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client with public anon key.
 * Never exposes the service-role key.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-dokansaathi.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
