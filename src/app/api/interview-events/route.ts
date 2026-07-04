import { NextRequest, NextResponse } from "next/server";
import { trackInterviewPrep } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; role?: string; data?: Record<string, unknown> };
  const { name, role, data } = body;

  if (!name || !role || !data) {
    return NextResponse.json({ error: "name, role, and data are required." }, { status: 400 });
  }

  try {
    const id = await trackInterviewPrep({ name, role }, data);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save interview prep event." },
      { status: 500 }
    );
  }
}
