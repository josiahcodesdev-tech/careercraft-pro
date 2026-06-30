import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  const body = await req.json() as {
    name: string;
    role: string;
    jobDescription: string;
    qualifications: string;
  };

  const { name, role, jobDescription, qualifications } = body;

  const systemPrompt = `You are an expert interview coach generating a realistic mock interview dialogue. Generate exactly 30 question-and-answer pairs for a job interview. The candidate's name is ${name} and the role is ${role}.

Rules for questions:
- Cover these sections in order: Opening & About You (3 questions), Experience & Skills (4 questions), Behavioural (5 questions), Situational (4 questions), Leadership & Teamwork (4 questions), Strengths & Self-Awareness (3 questions), Culture Fit & Motivation (3 questions), Role-Specific & Future (3 questions), Salary & Expectations (2 questions then Closing).
- Questions should be natural and conversational, tailored to the job description.

Rules for answers:
- Write answers as the candidate speaking naturally — human-like, not corporate or robotic.
- Use phrases like "Honestly, I think...", "Sure.", "To give you a concrete example..." occasionally.
- Reference skills and experience from the candidate's qualifications when relevant.
- Do NOT mention specific dates, years, timeframes, or degree names. Instead say things like "a qualification in [field]".
- Do NOT use first-person pronouns excessively — vary the sentence structure.
- Do NOT reveal the candidate's contact details, LinkedIn, CV headers, or location.
- Keep answers concise — 3–5 sentences max per answer.
- The opening question must greet ${name} by name.

Return a valid JSON array with this exact structure (no markdown, no code fences, just raw JSON):
[
  {"section": "Opening & About You", "question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  ...
]

Only include "section" on the first question of each new section.`;

  const userPrompt = `Job Description:\n${jobDescription.slice(0, 3000)}\n\nCandidate Qualifications (from CV):\n${qualifications.slice(0, 2000)}`;

  try {
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const raw = chat.choices[0].message.content?.trim() ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }

    // Handle both {qa: [...]} and [...] shapes
    type QAItem = { section?: string; question: string; answer: string };
    let qa: QAItem[] = [];
    if (Array.isArray(parsed)) {
      qa = parsed as QAItem[];
    } else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const firstArray = Object.values(obj).find((v) => Array.isArray(v));
      if (firstArray) qa = firstArray as QAItem[];
    }

    if (!qa.length) {
      return NextResponse.json({ error: "AI returned no questions." }, { status: 500 });
    }

    return NextResponse.json({ qa });
  } catch (err) {
    console.error("Interview generate error:", err);
    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
