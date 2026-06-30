import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
              "You are an expert CV writer specialising in ATS-optimised professional summaries. Rewrite the provided summary to be concise (4–6 sentences), impact-focused, and rich with strong industry keywords. Use active voice. Do not use first-person pronouns (no 'I', 'my', 'me'). Do not add placeholders. Return only the improved summary text, nothing else.",
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
              "You are an expert CV writer. Rewrite the provided experience bullets to be ATS-optimised. Rules: start each bullet with a strong action verb (Led, Managed, Developed, Delivered, Designed, Coordinated, Implemented, Built, Achieved, Improved, Reduced, Increased, Streamlined, Facilitated, Drove); quantify outcomes where possible; remove filler phrases; use active voice; no first-person pronouns. Return ONLY the improved bullets, one per line, without bullet symbols or numbering.",
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
