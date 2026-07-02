import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

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

REQUIRED SKILLS (incorporate ALL of these that the candidate can credibly claim): ${jdReqs.requiredSkills.join(", ")}

CORE RESPONSIBILITIES (reframe bullets to show the candidate doing these): ${jdReqs.coreResponsibilities.join(" | ")}

ATS KEYWORDS (weave these naturally into summary, bullets, and skills): ${jdReqs.atsKeywords.join(", ")}`
    : "";

  const jdOutputSchema = jdReqs
    ? `,
  "matchedRole": "${jdReqs.targetRole}",
  "jdKeywords": ${JSON.stringify(jdReqs.atsKeywords.slice(0, 12))}`
    : "";

  const jdRewriteRules = jdReqs
    ? `

JD-TARGETED REWRITING RULES (mandatory — these override general rules when in conflict):
• TAGLINE: Must start with "${jdReqs.targetRole}" followed by 2-3 of the required skills.
• SUMMARY: Must open with "${jdReqs.targetRole}" and mention at least 4 of the required skills/ATS keywords within the first 2 sentences. Frame the candidate's strongest achievements as directly relevant to the core responsibilities listed above.
• BULLETS: Prioritise bullets that demonstrate the listed core responsibilities. Where a bullet can naturally incorporate an ATS keyword, do it. Every role must have minimum 3 bullets.
• SKILLS: Every required skill that the candidate can credibly claim must appear in a skill group. Put required skills first in each group.`
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
1. Rewrite summary from scratch — compelling, keyword-rich, no I/my/me/we.
2. Transform bullets: [Action Verb] + [What] + [How/Tool] + [Outcome]. Infer numbers where reasonable.
3. Every role needs minimum 3 bullets. Generate from role context if missing.
4. Output 4-6 skill groups. Infer skills from experience where section is thin.
5. Standardise all dates to YYYY-MM.${jdRewriteRules}`;

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
