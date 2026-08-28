import { NextRequest, NextResponse } from "next/server";
import { aiText, aiConfigured, AiError } from "@/lib/ai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Turn a job description into starter fields for a NEW CV: a headline, a
// first-person professional summary the candidate personalises, and the key
// skills / ATS keywords to target. Does NOT invent experience.
export const maxDuration = 60;

interface JdDraft {
  role: string;
  summary: string;
  skills: string[];
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`jd-draft:${getClientIp(req)}`, 15, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let jobDescription: unknown;
  try {
    ({ jobDescription } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof jobDescription !== "string" || jobDescription.trim().length < 15) {
    return NextResponse.json({ error: "A job description is required." }, { status: 400 });
  }

  if (!aiConfigured()) {
    return NextResponse.json({ error: "AI is not configured." }, { status: 503 });
  }

  try {
    const raw = await aiText({
      tier: "quality",
      system:
            "You help a candidate START a CV tailored to a job. From the job description produce: a concise professional headline (the target role, optionally with 1-2 focus areas), a 2-3 sentence FIRST-PERSON professional summary the candidate can personalise (do NOT invent specific employers, numbers, or achievements — keep it about the target role and relevant strengths), and a list of the key skills / ATS keywords to target. Return ONLY raw JSON, no markdown.",
      user: `Job description:\n\n${jobDescription.slice(0, 5000)}\n\nReturn JSON: {"role":"target job title (+ optional focus areas)","summary":"2-3 sentence first-person summary","skills":["skill1","skill2",...]}`,
      maxTokens: 1200,
      json: true,
    });

    const parsed = JSON.parse(raw || "{}") as Partial<JdDraft>;
    const draft: JdDraft = {
      role: typeof parsed.role === "string" ? parsed.role : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s): s is string => typeof s === "string" && s.trim() !== "").slice(0, 18)
        : [],
    };
    return NextResponse.json({ draft });
  } catch (e) {
    if (e instanceof AiError && e.unavailable) {
      return NextResponse.json({ error: "AI is unavailable right now. Please try again shortly." }, { status: 503 });
    }
    return NextResponse.json({ error: "Could not process the job description." }, { status: 500 });
  }
}
