import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

// null = sync not configured (or running on the server): the app stays local-only.
export const supabase: SupabaseClient | null =
  typeof window !== "undefined" && url && key
    ? createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } })
    : null;
