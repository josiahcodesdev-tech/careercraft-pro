import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// As-you-type writing assist: given what the user has written so far in a CV
// field, suggest a short, natural continuation — tailored to the pasted job
// description when present. Kept small (few words / one clause) and cheap.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Called on typing pauses, so allow a generous burst before throttling.
  const limit = checkRateLimit(`cv-assist:${getClientIp(req)}`, 40, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ suggestion: "" }, { status: 429 });
  }

  let body: { text?: string; kind?: "summary" | "bullet"; jd?: string; role?: string; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ suggestion: "" }, { status: 400 });
  }

  const text = (body.text ?? "").slice(0, 1200);
  if (text.trim().length < 8) return NextResponse.json({ suggestion: "" });

  let client: ReturnType<typeof getOpenAI>;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ suggestion: "" }, { status: 503 });
  }

  const styleRules =
    body.kind === "bullet"
      ? "This is an experience bullet point. Continue in an achievement-focused style: strong past-tense action verbs, quantified outcomes where natural, no first-person pronouns, no 'Responsible for'."
      : "This is a professional summary. Continue in a concise, recruiter-ready style: active voice, no first-person pronouns (no I/my/me), industry keywords.";

  const jdContext = body.jd?.trim()
    ? `\n\nTarget job description (weave in its language/keywords where it fits naturally, do not copy verbatim):\n${body.jd.slice(0, 2500)}`
    : "";

  const roleContext = body.role ? `\nTarget role: ${body.role}` : "";
  const companyContext = body.company ? `\nCompany: ${body.company}` : "";

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You autocomplete a CV as the user writes it. Given their text so far, return ONLY the continuation to append — the next few words or one short clause/sentence that flows on naturally. Do NOT repeat any of their existing text. Do not add quotes, labels or explanations. Keep it under ~22 words. If their sentence already reads complete, suggest the beginning of a natural next sentence. ${styleRules}`,
        },
        {
          role: "user",
          content: `Text so far:\n"""${text}"""${roleContext}${companyContext}${jdContext}\n\nContinuation:`,
        },
      ],
      temperature: 0.5,
      max_tokens: 40,
    });

    let suggestion = res.choices[0]?.message?.content?.trim() ?? "";
    // Strip wrapping quotes and any leading ellipsis the model may add.
    suggestion = suggestion.replace(/^["'“”]+|["'“”]+$/g, "").replace(/^\.{2,}\s*/, "").trim();
    return NextResponse.json({ suggestion: suggestion.slice(0, 160) });
  } catch {
    // Best-effort: never surface an error for inline assist.
    return NextResponse.json({ suggestion: "" });
  }
}
