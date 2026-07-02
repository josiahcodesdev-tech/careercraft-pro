import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export async function POST(req: NextRequest) {
  let client;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  const body = await req.json() as { text: string; jobDescription?: string };
  const cvText = (body.text || "").slice(0, 8000);
  const jd = (body.jobDescription || "").slice(0, 3000);

  if (!cvText.trim()) {
    return NextResponse.json({ error: "No CV text provided." }, { status: 400 });
  }

  const jdSection = jd.trim()
    ? `\n\nJob Description (use this to tailor the summary and prioritise relevant skills/bullets):\n${jd}`
    : "";

  const jdInstructions = jd.trim()
    ? `\n- Job Description Tailoring: Rewrite the professional summary to align with the target role's requirements. In skillGroups, list skills most relevant to the JD first. In experience bullets, emphasise accomplishments that match the JD's key requirements.`
    : "";

  const systemPrompt = `You are a senior recruitment consultant and professional CV writer with 15+ years of experience placing candidates at top companies. Your task is to TRANSFORM and IMPROVE the provided CV — not just parse it. Produce a version that would genuinely impress a recruiter and pass ATS screening.

Return ONLY raw JSON (no markdown, no code fences) matching this exact structure:
{
  "fullName": "string — candidate's full name",
  "tagline": "string — compelling professional tagline using | as separator (e.g. 'Senior Data Analyst | Business Intelligence | Power BI'). If weak or missing, craft one from their experience.",
  "email": "string",
  "phone": "string",
  "location": "string — city and country only",
  "linkedin": "string — linkedin path only (e.g. linkedin.com/in/username), no https://",
  "summary": "string — REWRITE as a powerful 4-6 sentence professional summary. Rules: (1) Open with role identity + years of experience. (2) Mention 3-5 top skills/keywords relevant to their field. (3) Include 1-2 notable achievements or strengths with specificity. (4) Close with value proposition or career goal. NO first-person pronouns (no I/my/me/we). Active voice only. Make it compelling, specific, and keyword-rich.",
  "experience": [
    {
      "role": "string — job title only",
      "company": "string — company name only",
      "startDate": "string — YYYY-MM or empty",
      "endDate": "string — YYYY-MM or empty",
      "current": boolean,
      "bullets": ["string — REWRITE each bullet to be achievement-focused. Formula: [Strong Action Verb] + [What was done] + [How/Tool used] + [Measurable outcome or impact]. Rules: Start with past-tense action verb (Led, Managed, Developed, Implemented, Designed, Delivered, Coordinated, Streamlined, Established, Spearheaded, Drove, Achieved, Improved, Reduced, Increased, Built, Launched, Negotiated, Oversaw, Facilitated). Remove 'Responsible for', 'I was', 'Worked on', 'Helped'. Add quantification (%, KES, numbers, team size) where it can be reasonably inferred. If no bullets exist, generate 3 strong achievement bullets based on the role title and company context. End each with period. Minimum 3 bullets per role."]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string — degree type only (e.g. Bachelor of Science)",
      "field": "string — field of study (e.g. Computer Science)",
      "startDate": "string — YYYY-MM or empty",
      "endDate": "string — YYYY-MM or empty"
    }
  ],
  "skillGroups": [
    {
      "category": "string — use standard ATS category names: 'Technical Skills', 'Tools & Technology', 'Professional Competencies', 'Data & Analytics', 'Languages', 'Industry Knowledge', 'Management & Leadership'",
      "skills": "string — skills separated by · (middle dot). Include 5-8 skills per group. Infer additional relevant skills from their roles if sparse."
    }
  ]
}

IMPROVEMENT RULES — apply all of them:
1. SUMMARY: Always rewrite from scratch using their experience. Never copy verbatim from the original. Make it compelling enough that a recruiter reads to the end.
2. BULLETS: Transform weak/passive bullets into achievement statements. If original says "Responsible for managing team" → rewrite as "Led cross-functional team of [N] to deliver [outcome], improving [metric] by X%." Infer reasonable numbers based on role level.
3. BULLETS: Every role must have at least 3 bullets. Generate them from role context if missing.
4. SKILLS: Always output 4-6 skill groups. Extract skills from experience bullets if skills section is thin. Add industry-standard skills that are implicit for their role.
5. TAGLINE: Make it specific and keyword-rich. Match it to their most recent/senior role.
6. DATES: Standardise all to YYYY-MM. Use YYYY-01 if only year is known.
7. LINKEDIN: Extract path only. Empty string if not present.${jdInstructions}`;

  try {
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Parse this CV:\n\n${cvText}${jdSection}` },
      ],
      temperature: 0.4,
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
