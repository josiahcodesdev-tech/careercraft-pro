import { NextRequest, NextResponse } from "next/server";
import { getPaymentsEnabled, setPaymentsEnabled } from "@/lib/settings";

// Admin-only: /api/admin/* is gated by the session cookie check in src/proxy.ts.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const enabled = await getPaymentsEnabled();
    return NextResponse.json({ enabled }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load payment settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as { enabled?: unknown };
  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean." }, { status: 400 });
  }

  try {
    await setPaymentsEnabled(body.enabled);
    console.log(`[settings] payments ${body.enabled ? "ENABLED" : "DISABLED (giveaway mode)"}`);
    return NextResponse.json({ enabled: body.enabled });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update payment settings." },
      { status: 500 }
    );
  }
}
