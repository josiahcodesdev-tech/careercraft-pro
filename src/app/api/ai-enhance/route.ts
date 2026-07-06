import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

// A slower OpenAI response can exceed Vercel's 10s default timeout —
// without this, it gets killed by a 504 before it finishes.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let client;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  const body = await req.json() as {
    type: "summary" | "bullets";
    summary?: string;
    role?: string;
    company?: string;
    bullets?: string[];
    targetRole?: string;
  };

  try {
    if (body.type === "summary") {
      const chat = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior recruitment consultant and CV writer. Rewrite the provided professional summary to be compelling, ATS-optimised, and recruiter-ready. Requirements: (1) 4-6 sentences. (2) Open with role identity + years of experience if inferable. (3) Include 3-5 industry keywords. (4) Mention at least one specific strength or achievement. (5) Close with value proposition. No first-person pronouns (no I/my/me). Active voice. No placeholders like [X years]. Return only the improved summary text.",
          },
          {
            role: "user",
            content: `Target role: ${body.targetRole || "not specified"}\n\nCurrent summary:\n${body.summary}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return NextResponse.json({ result: chat.choices[0].message.content?.trim() ?? "" });
    }

    if (body.type === "bullets") {
      const existing = (body.bullets ?? []).filter((b) => b.trim()).join("\n");
      const chat = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a senior CV writer and recruitment specialist. Transform the provided experience bullets into achievement-focused, ATS-optimised statements. Rules: (1) Start each bullet with a strong past-tense action verb. (2) Use the formula: [Action Verb] + [What was done] + [How/with what] + [Measurable outcome]. (3) Add quantification (%, numbers, team sizes, KES amounts) where it can be reasonably inferred from the role level. (4) Remove 'Responsible for', 'I was', 'Worked on', 'Helped with', 'Assisted in'. (5) If fewer than 3 bullets, generate additional ones based on the role and company. (6) No first-person pronouns. Return ONLY the improved bullets, one per line, no symbols or numbering.",
          },
          {
            role: "user",
            content: `Role: ${body.role || "not specified"}\nCompany: ${body.company || "not specified"}\n\nCurrent bullets:\n${existing}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const text = chat.choices[0].message.content?.trim() ?? "";
      const bullets = text
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);

      return NextResponse.json({ result: bullets });
    }

    return NextResponse.json({ error: "Unknown type." }, { status: 400 });
  } catch (err) {
    console.error("AI enhance error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("401") || message.includes("Incorrect API key") || message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key. Please check your OpenAI key." }, { status: 401 });
    }
    if (message.includes("429") || message.includes("quota") || message.includes("billing")) {
      return NextResponse.json({ error: "OpenAI quota exceeded. Please check your billing." }, { status: 429 });
    }
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
  }
}
