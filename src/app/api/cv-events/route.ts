import { NextRequest, NextResponse } from "next/server";
import { trackCvDownload } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const body = await req.json() as { name?: string; template?: string; data?: Record<string, unknown> };
  const { name, template, data } = body;

  if (!name || !template || !data) {
    return NextResponse.json({ error: "name, template, and data are required." }, { status: 400 });
  }

  try {
    const id = await trackCvDownload({ name, template }, data);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save CV event." },
      { status: 500 }
    );
  }
}
