import { NextRequest, NextResponse } from "next/server";
import { trackInterviewPrep } from "@/lib/analytics";
import { lookupPaymentStatus } from "@/lib/payhero";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`interview-events:${getClientIp(req)}`, 20, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json() as { name?: string; role?: string; data?: Record<string, unknown>; reference?: string };
  const { name, role, data, reference } = body;

  if (!name || !role || !data) {
    return NextResponse.json({ error: "name, role, and data are required." }, { status: 400 });
  }
  if (typeof name !== "string" || name.length > 200 || typeof role !== "string" || role.length > 200) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  // Anyone who knows this endpoint shape could otherwise flood the admin
  // dashboard with fake entries. Allow it only for an authenticated admin
  // session (the "Create New" free-download path) or a reference that
  // resolves to a real confirmed M-Pesa payment.
  const isAdmin = verifySessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!isAdmin) {
    const paid = typeof reference === "string" && reference && (await lookupPaymentStatus(reference)) === "SUCCESS";
    if (!paid) {
      return NextResponse.json({ error: "No confirmed payment found for this download." }, { status: 403 });
    }
  }

  try {
    const id = await trackInterviewPrep({ name, role, paid: !isAdmin }, data);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save interview prep event." },
      { status: 500 }
    );
  }
}
