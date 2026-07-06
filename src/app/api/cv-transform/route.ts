import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Parsing/rewriting a full CV can take longer than Vercel's 10s default —
// without this, slower OpenAI responses get killed by a 504 before they finish.
export const maxDuration = 60;

interface JdRequirements {
  targetRole: string;
  targetCompany: string;
  requiredSkills: string[];
  coreResponsibilities: string[];
  atsKeywords: string[];
}

async function extractJdRequirements(client: ReturnType<typeof import("@/lib/openai").getOpenAI>, jd: string): Promise<JdRequirements> {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a job description analyst. Extract key hiring requirements from the job description. Return ONLY raw JSON with no markdown or code fences.",
      },
      {
        role: "user",
        content: `Analyse this job description and return JSON:\n\n${jd}\n\nJSON structure:\n{"targetRole":"exact job title from JD","targetCompany":"company name or empty string","requiredSkills":["skill1","skill2"...],"coreResponsibilities":["responsibility1","responsibility2"...],"atsKeywords":["keyword1","keyword2..."]}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 700,
    response_format: { type: "json_object" },
  });

  try {
    const raw = res.choices[0].message.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as JdRequirements;
    return {
      targetRole: parsed.targetRole || "",
      targetCompany: parsed.targetCompany || "",
      requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills.slice(0, 12) : [],
      coreResponsibilities: Array.isArray(parsed.coreResponsibilities) ? parsed.coreResponsibilities.slice(0, 6) : [],
      atsKeywords: Array.isArray(parsed.atsKeywords) ? parsed.atsKeywords.slice(0, 15) : [],
    };
  } catch {
    return { targetRole: "", targetCompany: "", requiredSkills: [], coreResponsibilities: [], atsKeywords: [] };
  }
}

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(`cv-transform:${getClientIp(req)}`, 10, 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let client;
  try {
    client = getOpenAI();
  } catch {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 503 });
  }

  const body = await req.json() as { text: string; jobDescription?: string };
  const cvText = (body.text || "").slice(0, 8000);
  const jd = (body.jobDescription || "").slice(0, 4000);
  const hasJd = !!jd.trim();

  if (!cvText.trim()) {
    return NextResponse.json({ error: "No CV text provided." }, { status: 400 });
  }

  // Stage 1 (JD only): extract structured requirements before touching the CV
  let jdReqs: JdRequirements | null = null;
  if (hasJd) {
    try {
      jdReqs = await extractJdRequirements(client, jd);
    } catch {
      // non-fatal — fall through to single-stage transform without JD
    }
  }

  // Build JD section injected into the transformation prompt
  const jdInjection = jdReqs
    ? `
TARGET ROLE: ${jdReqs.targetRole}${jdReqs.targetCompany ? ` at ${jdReqs.targetCompany}` : ""}

JD REQUIREMENTS (use only to guide reframing of what is ALREADY in the CV):
- Required skills: ${jdReqs.requiredSkills.join(", ")}
- Core responsibilities: ${jdReqs.coreResponsibilities.join(" | ")}
- ATS keywords: ${jdReqs.atsKeywords.join(", ")}`
    : "";

  const jdOutputSchema = jdReqs
    ? `,
  "matchedRole": "${jdReqs.targetRole}",
  "jdKeywords": ${JSON.stringify(jdReqs.atsKeywords.slice(0, 12))}`
    : "";

  const jdRewriteRules = jdReqs
    ? `

JD-TARGETED REWRITING RULES (mandatory):
• HONEST MATCH ONLY: Work strictly from what is already in the CV. Do NOT add skills, tools, roles, qualifications, or achievements the candidate has not demonstrated. Do NOT upgrade job titles. Do NOT invent responsibilities. A senior hiring manager will interview this person — anything fabricated will be exposed.
• TAGLINE: Lead with the target role title, then 2-3 skills that are genuinely evidenced in the CV and also appear in the JD requirements.
• SUMMARY: Open with the target role title. Mention JD keywords only where the candidate's actual experience supports them. Do not claim skills or seniority beyond what the experience shows.
• BULLETS: Reframe existing bullets to emphasise aspects most relevant to the JD. If a bullet already covers a core responsibility, make that clearer. Do not add invented accomplishments. Minimum 3 bullets per role.
• SKILLS: Surface skills from the JD that genuinely appear in the candidate's experience or skill section. Do NOT add JD skills the candidate has not demonstrated anywhere in the CV.`
    : "";

  const systemPrompt = `You are a senior recruitment consultant and professional CV writer. Your task is to TRANSFORM this CV${jdReqs ? ` to target the role of ${jdReqs.targetRole}` : ""} — not just parse it. Produce a version that impresses recruiters and passes ATS screening.

Return ONLY raw JSON (no markdown, no code fences):
{
  "fullName": "string",
  "tagline": "string — role | skill | skill | skill using | as separator",
  "email": "string",
  "phone": "string",
  "location": "string — city and country only",
  "linkedin": "string — path only e.g. linkedin.com/in/username",
  "summary": "string — 4-6 sentences, no first-person pronouns, opens with role identity",
  "experience": [
    {
      "role": "string",
      "company": "string",
      "startDate": "string — YYYY-MM or empty",
      "endDate": "string — YYYY-MM or empty",
      "current": boolean,
      "bullets": ["string — starts with strong past-tense action verb, ends with period, achievement-focused with quantification"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string — degree type only",
      "field": "string — field of study",
      "startDate": "string — YYYY-MM or empty",
      "endDate": "string — YYYY-MM or empty"
    }
  ],
  "skillGroups": [
    {
      "category": "string — e.g. Technical Skills / Tools & Technology / Professional Competencies",
      "skills": "string — skills separated by · (middle dot)"
    }
  ]${jdOutputSchema}
}

GENERAL RULES:
1. NEVER fabricate: do not add roles, companies, qualifications, tools, or achievements not evidenced in the original CV. Rewrite and reframe — do not invent.
2. Rewrite summary from scratch — compelling, keyword-rich, no I/my/me/we. Match seniority level to what the experience actually shows.
3. Transform bullets: [Action Verb] + [What] + [How/Tool] + [Outcome]. Use quantification only where it can be reasonably inferred from the role context (team size, scope, industry norms). Do not fabricate specific numbers.
4. Every role needs minimum 3 bullets — generate from the role title and company context if truly empty, but keep them plausible and conservative.
5. Output 4-6 skill groups. Only include skills evidenced in the experience or explicitly listed by the candidate.
6. Standardise all dates to YYYY-MM.${jdRewriteRules}`;

  const userMessage = jdReqs
    ? `Transform this CV. The job requirements have already been extracted below — your ONLY job now is to rewrite the CV to match them.\n${jdInjection}\n\n--- CV TO TRANSFORM ---\n${cvText}`
    : `Transform this CV to be ATS-optimised and recruiter-ready:\n\n${cvText}`;

  try {
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
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

    // Attach matchedRole / jdKeywords from stage-1 extraction if model didn't fill them
    if (jdReqs) {
      const p = parsed as Record<string, unknown>;
      if (!p.matchedRole) p.matchedRole = jdReqs.targetRole;
      if (!p.jdKeywords || !Array.isArray(p.jdKeywords) || (p.jdKeywords as string[]).length === 0) {
        p.jdKeywords = jdReqs.atsKeywords.slice(0, 12);
      }
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
