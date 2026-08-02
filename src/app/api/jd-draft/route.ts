import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
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

  let client: ReturnType<typeof getOpenAI>;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help a candidate START a CV tailored to a job. From the job description produce: a concise professional headline (the target role, optionally with 1-2 focus areas), a 2-3 sentence FIRST-PERSON professional summary the candidate can personalise (do NOT invent specific employers, numbers, or achievements — keep it about the target role and relevant strengths), and a list of the key skills / ATS keywords to target. Return ONLY raw JSON, no markdown.",
        },
        {
          role: "user",
          content: `Job description:\n\n${jobDescription.slice(0, 5000)}\n\nReturn JSON: {"role":"target job title (+ optional focus areas)","summary":"2-3 sentence first-person summary","skills":["skill1","skill2",...]}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as Partial<JdDraft>;
    const draft: JdDraft = {
      role: typeof parsed.role === "string" ? parsed.role : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s): s is string => typeof s === "string" && s.trim() !== "").slice(0, 18)
        : [],
    };
    return NextResponse.json({ draft });
  } catch (e) {
    const msg = e instanceof Error ? e.message.toLowerCase() : "";
    if (msg.includes("api key") || msg.includes("401")) {
      return NextResponse.json({ error: "Invalid OpenAI API key." }, { status: 401 });
    }
    if (msg.includes("quota") || msg.includes("429")) {
      return NextResponse.json({ error: "OpenAI quota exceeded." }, { status: 429 });
    }
    return NextResponse.json({ error: "Could not process the job description." }, { status: 500 });
  }
}
