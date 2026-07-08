import { NextRequest, NextResponse } from "next/server";
import { updateOpportunityStatus, type OpportunityStatus } from "@/lib/opportunities";

const VALID_STATUSES: OpportunityStatus[] = ["new", "reviewing", "applied", "ignored"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json()) as { status?: string };

  if (!body.status || !VALID_STATUSES.includes(body.status as OpportunityStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    await updateOpportunityStatus(id, body.status as OpportunityStatus);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update status." },
      { status: 500 }
    );
  }
}
