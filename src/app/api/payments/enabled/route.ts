import { NextResponse } from "next/server";
import { getPaymentsEnabled } from "@/lib/settings";

// Public on purpose: the CV builder and interview-prep forms are client
// components that need to know whether to show the paywall before the user
// reaches the download button. It leaks nothing — whether the site is
// currently charging is visible to anyone who clicks Download anyway.
//
// This is a UI hint, not the enforcement point. /api/cv-events and
// /api/interview-events re-read the flag server-side, so flipping this
// response in a browser buys nothing.

export const dynamic = "force-dynamic";

export async function GET() {
  const enabled = await getPaymentsEnabled();
  return NextResponse.json(
    { enabled },
    // Never cache: the whole point of the toggle is that it takes effect at
    // once, and a CDN-cached "false" would keep the site free after the
    // giveaway ended.
    { headers: { "Cache-Control": "no-store" } }
  );
}
