import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key-here") {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const body = await req.json() as { text: string };
  const cvText = (body.text || "").slice(0, 8000);

  if (!cvText.trim()) {
    return NextResponse.json({ error: "No CV text provided." }, { status: 400 });
  }

  const systemPrompt = `You are an expert CV parser and ATS formatter. Parse the provided CV text and return a structured JSON object.

Return ONLY raw JSON (no markdown, no code fences) matching this exact structure:
{
  "fullName": "string — candidate's full name",
  "tagline": "string — professional title or tagline, use | as separator if multiple parts",
  "email": "string",
  "phone": "string",
  "location": "string — city and country only",
  "linkedin": "string — linkedin URL or handle only, no https://",
  "summary": "string — professional summary, 4-6 sentences, no first-person pronouns (no I/my/me), ATS-optimised, active voice",
  "experience": [
    {
      "role": "string — job title only",
      "company": "string — company name only, no location",
      "startDate": "string — YYYY-MM format or empty string",
      "endDate": "string — YYYY-MM format or empty string",
      "current": boolean,
      "bullets": ["string — ATS bullet starting with strong action verb (Led, Managed, Developed, Delivered, Designed, Coordinated, Implemented, Built, Achieved, Improved, Streamlined, Facilitated, Drove, Conducted, Executed, Established), no first-person pronouns, quantify outcomes where possible, end with period"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string — degree type only (e.g. Bachelor of Science)",
      "field": "string — field of study only (e.g. Computer Science)",
      "startDate": "string — YYYY-MM or empty",
      "endDate": "string — YYYY-MM or empty"
    }
  ],
  "skillGroups": [
    {
      "category": "string — skill category name",
      "skills": "string — skills separated by · (middle dot)"
    }
  ]
}

ATS formatting rules:
- Summary: Remove all first-person pronouns. Replace "I have" with "Professional with". Start with a strong professional statement.
- Bullets: Each must start with a strong action verb. Remove "Responsible for", "I was", "Worked on" patterns. Add periods at end.
- If bullet points are missing, generate 2-3 ATS bullets based on the role context.
- Dates: Convert all date formats to YYYY-MM. If only year known, use YYYY-01.
- Skills: Group logically. Use · as separator between skills in each group.
- LinkedIn: Extract only the path (e.g. linkedin.com/in/username), not full URL.
- If a field is missing or unknown, use empty string "".`;

  try {
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this CV:\n\n${cvText}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const raw = chat.choices[0].message.content?.trim() ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("CV transform error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("401") || message.includes("Incorrect API key") || message.includes("authentication")) {
      return NextResponse.json({ error: "Invalid API key. Please check your OpenAI key in settings." }, { status: 401 });
    }
    if (message.includes("429") || message.includes("quota") || message.includes("billing")) {
      return NextResponse.json({ error: "OpenAI quota exceeded. Please check your billing at platform.openai.com." }, { status: 429 });
    }
    return NextResponse.json({ error: `AI request failed: ${message}` }, { status: 500 });
  }
}
