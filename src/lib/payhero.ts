import { getSupabaseAdmin } from "@/lib/supabase-admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  return getSupabaseAdmin();
}

function dig(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function firstDefined(obj: Record<string, unknown>, paths: string[][]): unknown {
  for (const path of paths) {
    const val = dig(obj, path);
    if (val !== undefined && val !== null && val !== "") return val;
  }
  return undefined;
}

/**
 * PayHero's webhook payload shape isn't publicly documented in detail and
 * varies by response/response.data nesting, so every lookup here tries
 * several plausible locations/casings rather than a single fixed path.
 */
export function extractPayheroFields(body: Record<string, unknown>): {
  checkoutRequestId: string;
  externalReference: string;
  status: string;
} {
  const checkoutRequestId = String(
    firstDefined(body, [
      ["CheckoutRequestID"],
      ["checkout_request_id"],
      ["response", "CheckoutRequestID"],
      ["response", "checkout_request_id"],
      ["data", "CheckoutRequestID"],
      ["data", "checkout_request_id"],
      ["transaction", "CheckoutRequestID"],
      ["transaction", "checkout_request_id"],
    ]) ?? ""
  );

  const externalReference = String(
    firstDefined(body, [
      ["ExternalReference"],
      ["external_reference"],
      ["reference"],
      ["Reference"],
      ["response", "ExternalReference"],
      ["response", "external_reference"],
      ["data", "ExternalReference"],
      ["data", "external_reference"],
      ["transaction", "ExternalReference"],
      ["transaction", "external_reference"],
    ]) ?? ""
  );

  const rawStatus = String(
    firstDefined(body, [
      ["status"],
      ["Status"],
      ["response", "status"],
      ["response", "Status"],
      ["data", "status"],
      ["transaction", "status"],
      ["response_status"],
    ]) ?? ""
  )
    .toUpperCase()
    .trim();

  let status = rawStatus;
  if (status === "COMPLETE" || status === "COMPLETED" || status === "SUCCESSFUL") status = "SUCCESS";
  if (status === "CANCELLED" || status === "CANCELED") status = "FAILED";
  if (!status && body.success === false) status = "FAILED";

  return { checkoutRequestId, externalReference, status: status || "PENDING" };
}

export async function recordPaymentStatus(fields: {
  checkoutRequestId: string;
  externalReference: string;
  status: string;
  raw: unknown;
}): Promise<void> {
  if (!fields.checkoutRequestId && !fields.externalReference) return;

  const { error } = await db().from("payhero_status").insert({
    checkout_request_id: fields.checkoutRequestId || null,
    external_reference: fields.externalReference || null,
    status: fields.status,
    raw: fields.raw,
  });
  if (error) console.error("[payments] failed to record status:", error.message);
}

export async function lookupPaymentStatus(ref: string): Promise<string | null> {
  // Two separate .eq() lookups rather than a single .or() filter string —
  // avoids PostgREST filter-syntax issues if `ref` ever contains a comma/period.
  const [byCheckoutId, byExternalRef] = await Promise.all([
    db().from("payhero_status").select("status, updated_at").eq("checkout_request_id", ref).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    db().from("payhero_status").select("status, updated_at").eq("external_reference", ref).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (byCheckoutId.error) console.error("[payments] lookup by checkout_request_id failed:", byCheckoutId.error.message);
  if (byExternalRef.error) console.error("[payments] lookup by external_reference failed:", byExternalRef.error.message);

  const candidates = [byCheckoutId.data, byExternalRef.data].filter(Boolean) as { status: string; updated_at: string }[];
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  return candidates[0].status;
}
