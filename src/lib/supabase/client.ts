import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client (uses the public anon/publishable key).
 * Cast to supabase-js's own typed client — `@supabase/ssr` ships looser
 * generics that otherwise erase the schema types on `.from()`.
 */
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as unknown as SupabaseClient<Database>;
}
