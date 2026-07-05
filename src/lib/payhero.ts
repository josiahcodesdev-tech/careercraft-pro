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

// Only matches string values. PayHero's top-level `status` field is
// sometimes a BOOLEAN meaning "the API call itself succeeded" (not
// "the payment succeeded") — treating it as a status string caused
// confirmations to silently never match "SUCCESS"/"FAILED".
function firstDefinedString(obj: Record<string, unknown>, paths: string[][]): string | undefined {
  for (const path of paths) {
    const val = dig(obj, path);
    if (typeof val === "string" && val !== "") return val;
  }
  return undefined;
}

function firstDefinedNumber(obj: Record<string, unknown>, paths: string[][]): number | undefined {
  for (const path of paths) {
    const val = dig(obj, path);
    if (typeof val === "number") return val;
    if (typeof val === "string" && val !== "" && !Number.isNaN(Number(val))) return Number(val);
  }
  return undefined;
}

/**
 * PayHero wraps the real transaction result in a nested `response` object
 * with PascalCase fields (Status, ResultCode, CheckoutRequestID,
 * ExternalReference) — mirroring the raw Safaricom Daraja STK callback
 * shape (Body.stkCallback.ResultCode etc). Some endpoints/versions instead
 * return a flat snake_case body. This checks every plausible location
 * rather than assuming one fixed shape.
 */
export function derivePayheroStatus(data: Record<string, unknown>): string {
  const rawStatus = (
    firstDefinedString(data, [
      ["response", "Status"],
      ["response", "status"],
      ["Status"],
      ["status"],
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

  if (!status) {
    // ResultCode (0 = success, non-zero = failure/cancelled) is the most
    // reliable signal on shapes that don't expose a plain Status string —
    // e.g. the raw Daraja stkCallback passthrough.
    const resultCode = firstDefinedNumber(data, [
      ["response", "ResultCode"],
      ["ResultCode"],
      ["Body", "stkCallback", "ResultCode"],
      ["data", "ResultCode"],
      ["transaction", "ResultCode"],
    ]);
    if (resultCode !== undefined) status = resultCode === 0 ? "SUCCESS" : "FAILED";
  }

  if (!status && data.success === false) status = "FAILED";

  return status || "PENDING";
}

export function extractCheckoutRequestId(body: Record<string, unknown>): string {
  return (
    firstDefinedString(body, [
      ["response", "CheckoutRequestID"],
      ["response", "checkout_request_id"],
      ["CheckoutRequestID"],
      ["checkout_request_id"],
      ["data", "CheckoutRequestID"],
      ["data", "checkout_request_id"],
      ["transaction", "CheckoutRequestID"],
      ["transaction", "checkout_request_id"],
      ["Body", "stkCallback", "CheckoutRequestID"],
    ]) ?? ""
  );
}

export function extractExternalReference(body: Record<string, unknown>): string {
  return (
    firstDefinedString(body, [
      ["response", "ExternalReference"],
      ["response", "external_reference"],
      ["ExternalReference"],
      ["external_reference"],
      ["reference"],
      ["Reference"],
      ["data", "ExternalReference"],
      ["data", "external_reference"],
      ["transaction", "ExternalReference"],
      ["transaction", "external_reference"],
    ]) ?? ""
  );
}

export function extractPayheroFields(body: Record<string, unknown>): {
  checkoutRequestId: string;
  externalReference: string;
  status: string;
} {
  return {
    checkoutRequestId: extractCheckoutRequestId(body),
    externalReference: extractExternalReference(body),
    status: derivePayheroStatus(body),
  };
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
