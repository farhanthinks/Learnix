import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role client for the handful of operations a user's own session
 * can't do — currently just deleting their own auth.users row (there's no
 * client-facing "delete my account" API in Supabase Auth). Never expose this
 * client's key to the browser; only call this from server actions/routes.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
