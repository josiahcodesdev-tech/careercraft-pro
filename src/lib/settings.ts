import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabaseAdmin();
}

/**
 * Whether clients are charged for downloads.
 *
 * False is "giveaway mode": the paywall is hidden, no M-Pesa prompt is sent,
 * and downloads are recorded with paid = false so they stay out of revenue.
 *
 * Every failure path returns true. A missing row, an unreachable database or
 * a malformed response must never be read as "everything is free" — the cost
 * of wrongly charging nobody is a day of lost revenue, while the cost of
 * wrongly opening the paywall is every download for as long as it goes
 * unnoticed.
 */
export async function getPaymentsEnabled(): Promise<boolean> {
  const { data, error } = await db()
    .from("app_settings")
    .select("payments_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[settings] failed to read payments_enabled:", error.message);
    return true;
  }
  return data?.payments_enabled !== false;
}

export async function setPaymentsEnabled(enabled: boolean): Promise<void> {
  const { error } = await db()
    .from("app_settings")
    .upsert({ id: 1, payments_enabled: enabled });
  if (error) throw new Error(error.message);
}
