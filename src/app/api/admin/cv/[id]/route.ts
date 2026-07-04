import { NextRequest, NextResponse } from "next/server";
import { getCvEvent } from "@/lib/analytics";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await getCvEvent(id);
    if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load CV." },
      { status: 500 }
    );
  }
}
