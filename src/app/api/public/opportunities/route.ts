import { NextRequest, NextResponse } from "next/server";
import { listOpportunities, type Opportunity } from "@/lib/opportunities";
import { classifyServiceAreas } from "@/lib/scrapers/service-keywords";

// Public, read-only feed of scraped opportunities for embedding on other sites.
// Deliberately outside /api/admin/* so it isn't gated by the admin cookie in
// src/proxy.ts. If OPPORTUNITIES_API_KEY is set, callers must present it (query
// ?key=, `x-api-key` header, or `Authorization: Bearer <key>`); if it's unset
// the feed is fully open, since scraped opportunities are already public data.

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;

// Map the internal row to a consumer-friendly shape — drop admin-only fields
// (status/externalId/raw) and give the timestamps clearer names.
function toPublic(o: Opportunity) {
  return {
    id: o.id,
    source: o.source,
    title: o.title,
    organization: o.organization,
    category: o.category, // "rfp" | "job"
    location: o.location,
    deadline: o.deadline, // YYYY-MM-DD or null
    url: o.sourceUrl,
    scrapedAt: o.firstSeenAt,
    updatedAt: o.lastSeenAt,
  };
}

function authorized(req: NextRequest, key: string | null): boolean {
  const required = process.env.OPPORTUNITIES_API_KEY;
  if (!required) return true; // open when no key is configured
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const provided = key || req.headers.get("x-api-key") || bearer;
  return provided === required;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (!authorized(req, searchParams.get("key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const area = searchParams.get("area") ?? undefined; // service-area key
  const from = searchParams.get("from") ?? undefined; // scraped-on-or-after (YYYY-MM-DD)
  const to = searchParams.get("to") ?? undefined; // scraped-on-or-before (YYYY-MM-DD)
  const limitParam = Number(searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  try {
    let rows = await listOpportunities({ status, category, source });

    // Default to hiding admin-dismissed rows unless a status was explicitly asked for.
    if (!status) rows = rows.filter((o) => o.status !== "ignored");

    if (area && area !== "all") {
      rows = rows.filter((o) => classifyServiceAreas(`${o.title} ${o.organization ?? ""}`).includes(area));
    }
    if (from) rows = rows.filter((o) => (o.firstSeenAt ? o.firstSeenAt.slice(0, 10) >= from : false));
    if (to) rows = rows.filter((o) => (o.firstSeenAt ? o.firstSeenAt.slice(0, 10) <= to : false));

    const data = rows.slice(0, limit).map(toPublic);

    return NextResponse.json(
      { count: data.length, data },
      {
        headers: {
          ...CORS_HEADERS,
          // Let a CDN cache the feed briefly; the scan only runs daily.
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load opportunities." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
