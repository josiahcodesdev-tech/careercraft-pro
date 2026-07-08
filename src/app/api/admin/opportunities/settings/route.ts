import { NextRequest, NextResponse } from "next/server";
import { getScanEnabled, setScanEnabled } from "@/lib/opportunities";

export async function GET() {
  try {
    const enabled = await getScanEnabled();
    return NextResponse.json({ enabled });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load scan settings." },
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
    await setScanEnabled(body.enabled);
    return NextResponse.json({ enabled: body.enabled });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update scan settings." },
      { status: 500 }
    );
  }
}
