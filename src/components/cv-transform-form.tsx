"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import {
  Upload,
  FileText,
  Loader2,
  ArrowRight,
  CheckCircle,
  Sparkles,
  X,
} from "lucide-react";

const scanSteps = [
  "Scanning document...",
  "Extracting personal details...",
  "Identifying work experience...",
  "Parsing education & skills...",
  "Formatting for ATS...",
];

interface ParsedCv {
  fullName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
  experience: { company: string; role: string; startDate: string; endDate: string; current: boolean; bullets: string[] }[];
  education: { institution: string; degree: string; field: string; startDate: string; endDate: string }[];
  skillGroups: { category: string; skills: string }[];
}

function isSectionHeader(l: string): boolean {
  const t = l.replace(/\s+/g, " ").trim();
  return /^(professional\s+summary|professional\s+experience|work\s+experience|experience|employment\s+history|education|certifications?|core\s+skills|skills|key\s+skills|technical\s+skills|references?|hobbies|interests|referees?)\s*$/i.test(t);
}
const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\b|\b\d{4}\s*[-–—]\s*(present|\d{4})\b/i;

function extractSection(lines: string[], headerRe: RegExp): string[] {
  const start = lines.findIndex((l) => headerRe.test(l.replace(/\s+/g, " ").trim()));
  if (start === -1) return [];
  const end = lines.findIndex((l, i) => i > start && isSectionHeader(l));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

function extractDateParts(line: string): { startDate: string; endDate: string; current: boolean } {
  const present = /present/i.test(line);
  const months: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const dateMatches = [...line.matchAll(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+(\d{4})/gi)];
  if (dateMatches.length >= 2) {
    const m1 = months[dateMatches[0][1].toLowerCase().slice(0, 3)] || "01";
    const m2 = months[dateMatches[1][1].toLowerCase().slice(0, 3)] || "01";
    return { startDate: `${dateMatches[0][2]}-${m1}`, endDate: present ? "" : `${dateMatches[1][2]}-${m2}`, current: present };
  }
  if (dateMatches.length === 1) {
    const m1 = months[dateMatches[0][1].toLowerCase().slice(0, 3)] || "01";
    return { startDate: `${dateMatches[0][2]}-${m1}`, endDate: "", current: present };
  }
  const yearMatch = line.match(/(\d{4})\s*[-–—]\s*(present|\d{4})/i);
  if (yearMatch) {
    return { startDate: `${yearMatch[1]}-01`, endDate: yearMatch[2].toLowerCase() === "present" ? "" : `${yearMatch[2]}-01`, current: present };
  }
  return { startDate: "", endDate: "", current: false };
}

function parseCvText(text: string): ParsedCv {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Contact info
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/[\+]?\d[\d\s\-()]{7,}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-]+/i);
  const locationPatterns = /\b(nairobi|mombasa|kisumu|eldoret|nakuru|kenya|uganda|tanzania|london|new york|dubai|kampala|dar\s+es\s+salaam)\b/i;
  const locationLine = lines.find((l) => locationPatterns.test(l) && l.split(" ").length <= 6);

  // Name — first non-contact, non-section line
  let fullName = "";
  for (const l of lines.slice(0, 5)) {
    if (l.length > 3 && l.length < 50 && !/[@.|+\d]{3,}/.test(l) && !isSectionHeader(l) && !locationPatterns.test(l) && !/linkedin/i.test(l)) {
      fullName = l;
      break;
    }
  }

  // Tagline — line with pipes/separators near top
  let tagline = "";
  for (const l of lines.slice(1, 10)) {
    if (/[|·]/.test(l) && l !== fullName && !/[@+]/.test(l) && !locationPatterns.test(l)) {
      tagline = l;
      break;
    }
  }

  // Summary — handle both paragraph and bullet point formats
  const summaryLines = extractSection(lines, /^(professional\s+summary|summary|profile|objective|about\s+me)\s*$/i);
  const hasBulletSummary = summaryLines.some((l) => /^[•\-–✓]/.test(l));
  let summary = "";
  if (hasBulletSummary) {
    const bulletPoints = summaryLines
      .filter((l) => /^[•\-–✓]/.test(l) || (l.length > 10 && !/^[A-Z\s]+$/.test(l)))
      .map((l) => l.replace(/^[•\-–✓]\s*/, "").trim())
      .filter((l) => l.length > 5);
    summary = bulletPoints.join(". ").replace(/\.\./g, ".").replace(/\s{2,}/g, " ");
    if (summary && !summary.endsWith(".")) summary += ".";
  } else {
    summary = summaryLines.filter((l) => l.length > 10).join(" ");
  }

  // Experience — handle "Role Title" + "Date" (same or separate line), "Company — Location", then bullets
  const experience: ParsedCv["experience"] = [];
  const expLines = extractSection(lines, /^(professional\s+experience|work\s+experience|experience|employment\s+history)\s*$/i);

  let cur: { role: string; company: string; bullets: string[]; startDate: string; endDate: string; current: boolean } | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const l = expLines[i];
    const hasDate = DATE_RE.test(l);
    const isBullet = /^[•\-–✓·]/.test(l);

    // Date-only line (e.g. "Sep 2025 – Present") — attach to previous role or next
    if (hasDate && l.replace(DATE_RE, "").replace(/[-–—\s]/g, "").length < 5 && !isBullet) {
      if (cur && !cur.startDate) {
        const dates = extractDateParts(l);
        cur.startDate = dates.startDate;
        cur.endDate = dates.endDate;
        cur.current = dates.current;
      }
      continue;
    }

    // Role title line — has a date embedded, or is a title-like line followed by company
    if (hasDate && !isBullet) {
      if (cur) experience.push(cur);
      const roleName = l
        .replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s*[-–—]?\s*(present|\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4})?/gi, "")
        .replace(/\d{4}\s*[-–—]\s*(present|\d{4})/gi, "")
        .replace(/\s*[-–—]\s*$/, "")
        .trim();
      const dates = extractDateParts(l);
      // Next line is likely company — Location
      let company = "";
      const nextLine = expLines[i + 1];
      if (nextLine && !DATE_RE.test(nextLine) && !/^[•\-–✓·]/.test(nextLine) && !isSectionHeader(nextLine) && nextLine.length > 3 && nextLine.length < 100) {
        company = nextLine.replace(/\s*[-–—]\s*$/, "").trim();
        i++;
      }
      cur = { role: roleName, company, bullets: [], ...dates };
      continue;
    }

    // Role title without date on same line — check if next line has a date
    if (!isBullet && !hasDate && cur === null && l.length > 5 && l.length < 80 && /^[A-Z]/.test(l)) {
      const nextLine = expLines[i + 1];
      const nextHasDate = nextLine && DATE_RE.test(nextLine);
      if (nextHasDate || (nextLine && /^[A-Z]/.test(nextLine) && /[-–—]/.test(nextLine))) {
        if (cur) experience.push(cur);
        const dates = nextHasDate ? extractDateParts(nextLine) : { startDate: "", endDate: "", current: false };
        cur = { role: l, company: "", bullets: [], ...dates };
        if (nextHasDate) i++;
        // Check for company line after date
        const companyLine = expLines[i + 1];
        if (companyLine && !DATE_RE.test(companyLine) && !/^[•\-–✓·]/.test(companyLine) && !isSectionHeader(companyLine) && companyLine.length > 3 && companyLine.length < 100) {
          cur.company = companyLine.trim();
          i++;
        }
        continue;
      }
    }

    // Bullet point
    if (isBullet) {
      const bullet = l.replace(/^[•\-–✓·]\s*/, "").trim();
      if (cur && bullet.length > 5) cur.bullets.push(bullet);
      continue;
    }

    // Continuation line — appends to last bullet or becomes company
    if (cur && l.length > 15 && !isSectionHeader(l)) {
      if (cur.bullets.length > 0) {
        // If last bullet doesn't end with a period, it's a continuation
        const lastBullet = cur.bullets[cur.bullets.length - 1];
        if (!lastBullet.endsWith(".") && !lastBullet.endsWith(",")) {
          cur.bullets[cur.bullets.length - 1] = lastBullet + " " + l;
        } else {
          cur.bullets.push(l);
        }
      } else if (!cur.company && l.length < 100) {
        cur.company = l;
      }
    }
  }
  if (cur) experience.push(cur);

  // Education
  const education: ParsedCv["education"] = [];
  const eduLines = extractSection(lines, /^(education|academic\s+qualifications?)\s*$/i);

  let eduCur: { degree: string; institution: string; field: string; startDate: string; endDate: string } | null = null;

  for (let i = 0; i < eduLines.length; i++) {
    const l = eduLines[i];
    const hasDate = DATE_RE.test(l);
    const hasDegree = /\b(bachelor|master|diploma|certificate|bsc|msc|mba|phd|kcse|kcpe|b\.a|m\.a|hnd|degree)\b/i.test(l);
    const hasInst = /\b(university|college|polytechnic|institute|school|academy)\b/i.test(l);

    // Date-only line — attach to current entry
    if (hasDate && !hasDegree && !hasInst && l.replace(DATE_RE, "").replace(/[-–—\s]/g, "").length < 5) {
      if (eduCur && !eduCur.startDate) {
        const dates = extractDateParts(l);
        eduCur.startDate = dates.startDate;
        eduCur.endDate = dates.endDate;
      }
      continue;
    }

    if (hasDegree || (hasDate && !hasInst)) {
      if (eduCur) education.push(eduCur);
      const degreeName = l
        .replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4}\s*[-–—]?\s*(present|\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{4})?/gi, "")
        .replace(/\d{4}\s*[-–—]\s*\d{4}/g, "")
        .replace(/\s*[-–—]\s*$/, "")
        .trim();
      const dates = extractDateParts(l);
      const fieldMatch = degreeName.match(/\b(?:in)\s+(.+)/i);
      eduCur = {
        degree: fieldMatch ? degreeName.replace(fieldMatch[0], "").trim() : degreeName,
        institution: "",
        field: fieldMatch?.[1]?.trim() || "",
        ...dates,
      };
      // Next line is likely institution
      const nextLine = eduLines[i + 1];
      if (nextLine && (hasInst || (!DATE_RE.test(nextLine) && !/^[•\-–]/.test(nextLine) && !isSectionHeader(nextLine) && nextLine.length > 3))) {
        eduCur.institution = nextLine.replace(/[,]\s*$/, "").trim();
        i++;
      }
    } else if (hasInst) {
      if (eduCur && !eduCur.institution) {
        eduCur.institution = l.replace(/[,]\s*$/, "").trim();
      } else {
        if (eduCur) education.push(eduCur);
        eduCur = { degree: "", institution: l.replace(/[,]\s*$/, "").trim(), field: "", startDate: "", endDate: "" };
      }
    }
  }
  if (eduCur) education.push(eduCur);

  // Skills — handle "Category Skills" format with various separators
  const skillGroups: ParsedCv["skillGroups"] = [];
  const skillLines = extractSection(lines, /^(skills|core\s+skills|key\s+skills|technical\s+skills)\s*$/i);

  let pendingCategory = "";
  for (const l of skillLines) {
    if (l.length <= 3 || /^references?\b/i.test(l)) continue;

    // "Category Skills" pattern (category then skills separated by · or ,)
    const colonMatch = l.match(/^(.{3,30}?)\s+([\w&()\/].+[·,;].+)$/);
    if (colonMatch) {
      skillGroups.push({ category: colonMatch[1].trim(), skills: colonMatch[2].trim() });
      pendingCategory = "";
      continue;
    }

    // "Category: Skills" explicit colon
    const explicitColon = l.split(/:\s+/);
    if (explicitColon.length === 2 && explicitColon[0].length < 35) {
      skillGroups.push({ category: explicitColon[0].trim(), skills: explicitColon[1].trim() });
      pendingCategory = "";
      continue;
    }

    // Short line = category label, next line = skills
    if (l.split(" ").length <= 4 && !/[·,;]/.test(l)) {
      if (pendingCategory) {
        skillGroups.push({ category: pendingCategory, skills: l });
        pendingCategory = "";
      } else {
        pendingCategory = l;
      }
      continue;
    }

    // Line with separators = skills for pending category
    if (/[·,;]/.test(l)) {
      skillGroups.push({ category: pendingCategory || "Skills", skills: l.replace(/^[•\-–]\s*/, "") });
      pendingCategory = "";
    }
  }

  return atsFormat({
    fullName,
    tagline,
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0]?.trim() || "",
    location: locationLine || "",
    linkedin: linkedinMatch?.[0] || "",
    summary,
    experience: experience.slice(0, 6),
    education: education.slice(0, 4),
    skillGroups: skillGroups.slice(0, 8),
  });
}

const ACTION_VERBS = [
  "Led", "Managed", "Developed", "Implemented", "Designed", "Delivered",
  "Coordinated", "Established", "Streamlined", "Spearheaded", "Directed",
  "Facilitated", "Conducted", "Created", "Built", "Executed", "Launched",
  "Optimised", "Maintained", "Collaborated", "Supported", "Oversaw",
  "Administered", "Produced", "Achieved", "Strengthened", "Improved",
];

function atsFormatBullet(bullet: string): string {
  let b = bullet.trim();
  // Remove leading pronouns
  b = b.replace(/^(I\s+|We\s+|My\s+|The\s+team\s+)/i, "");
  // Capitalise first letter
  b = b.charAt(0).toUpperCase() + b.slice(1);
  // Check if starts with action verb
  const firstWord = b.split(/\s+/)[0].replace(/[^a-zA-Z]/g, "");
  const isAction = ACTION_VERBS.some((v) => v.toLowerCase() === firstWord.toLowerCase());
  if (!isAction) {
    // Try to detect the verb and restructure
    if (/^responsible\s+for\s+/i.test(b)) {
      b = b.replace(/^responsible\s+for\s+/i, "Managed ");
    } else if (/^worked\s+on\s+/i.test(b)) {
      b = b.replace(/^worked\s+on\s+/i, "Contributed to ");
    } else if (/^helped\s+(to\s+)?/i.test(b)) {
      b = b.replace(/^helped\s+(to\s+)?/i, "Supported ");
    } else if (/^involved\s+in\s+/i.test(b)) {
      b = b.replace(/^involved\s+in\s+/i, "Contributed to ");
    } else if (/^tasked\s+with\s+/i.test(b)) {
      b = b.replace(/^tasked\s+with\s+/i, "Executed ");
    } else if (/^(assisted|aided)\s+(in\s+|with\s+)?/i.test(b)) {
      b = b.replace(/^(assisted|aided)\s+(in\s+|with\s+)?/i, "Supported ");
    } else if (/^(ensured|made\s+sure)\s+/i.test(b)) {
      b = b.replace(/^(ensured|made\s+sure)\s+/i, "Maintained ");
    } else if (/^(did|performed|carried\s+out)\s+/i.test(b)) {
      b = b.replace(/^(did|performed|carried\s+out)\s+/i, "Executed ");
    }
  }
  // Remove trailing period if present, add one
  b = b.replace(/[.\s]+$/, "") + ".";
  return b;
}

function atsFormat(cv: ParsedCv): ParsedCv {
  // Ensure summary is 4-6 sentences, professional tone
  let summary = cv.summary.trim();
  if (summary) {
    // Remove first-person pronouns for ATS
    summary = summary.replace(/\bI am\b/gi, "").replace(/\bI have\b/gi, "Professional with").replace(/\bI\b/g, "");
    summary = summary.replace(/\s{2,}/g, " ").trim();
    // Ensure it starts with a capital
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  }

  // Format experience bullets with action verbs
  const experience = cv.experience.map((exp) => ({
    ...exp,
    role: exp.role.trim(),
    company: exp.company.trim(),
    bullets: exp.bullets.length > 0
      ? exp.bullets.map(atsFormatBullet)
      : ["Contributed to key initiatives and deliverables in this role."],
  }));

  // Ensure education has clean formatting
  const education = cv.education.map((edu) => ({
    ...edu,
    degree: edu.degree.replace(/\s{2,}/g, " ").trim(),
    institution: edu.institution.replace(/\s{2,}/g, " ").trim(),
    field: edu.field.replace(/\s{2,}/g, " ").trim(),
  }));

  // Clean skill groups — use ATS-standard category names
  const categoryMap: Record<string, string> = {
    "tools": "Tools & Technology",
    "tools & technology": "Tools & Technology",
    "tech": "Tools & Technology",
    "software": "Tools & Technology",
    "technical": "Technical Skills",
    "soft skills": "Professional Competencies",
    "soft": "Professional Competencies",
    "languages": "Languages",
    "data": "Data & Analytics",
    "analysis": "Data & Analytics",
    "analysis & reporting": "Data & Analytics",
    "management": "Management & Leadership",
    "leadership": "Management & Leadership",
  };

  const skillGroups = cv.skillGroups.map((g) => {
    const key = g.category.toLowerCase().trim();
    return {
      category: categoryMap[key] || g.category,
      skills: g.skills.replace(/\s{2,}/g, " ").trim(),
    };
  });

  // Clean tagline — use pipes as separators
  let tagline = cv.tagline.trim();
  tagline = tagline.replace(/[·\/]/g, "|").replace(/\s*\|\s*/g, " | ");

  return {
    ...cv,
    fullName: cv.fullName.trim(),
    tagline,
    summary,
    experience,
    education,
    skillGroups,
  };
}

const CV_TRANSFORM_KEY = "careercraft_cv_transform";

export function CvTransformForm() {
  const [file, setFile] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    setFile(f.name);
    setScanning(true);
    setScanStep(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    scanSteps.forEach((_, i) => {
      timers.push(setTimeout(() => setScanStep(i), i * 800));
    });

    try {
      let text: string;
      if (f.name.toLowerCase().endsWith(".pdf")) {
        text = await extractTextFromPdf(f);
      } else {
        text = await f.text();
      }

      if (!text || text.trim().length < 20) {
        throw new Error("Empty or unreadable content");
      }

      // Wait for scanning animation to finish
      const elapsed = Date.now();
      const minWait = scanSteps.length * 800;
      const remaining = minWait - (Date.now() - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));

      const result = parseCvText(text);
      setParsed(result);
      localStorage.setItem(CV_TRANSFORM_KEY, JSON.stringify(result));
    } catch (err) {
      console.error("CV Transform upload error:", err);
      setError("Could not read this file. Please try a different format or paste content manually.");
      setFile("");
      setParsed(null);
    } finally {
      timers.forEach(clearTimeout);
      setScanning(false);
      setScanStep(0);
      e.target.value = "";
    }
  }, []);

  const handleTransform = () => {
    router.push("/cv-builder?transform=1");
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel */}
      <div className="w-full lg:w-1/2 overflow-y-auto border-r border-border bg-background">
        <div className="p-8">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
              CV Transform
            </p>
            <h1 className="font-heading text-2xl font-black tracking-tight leading-tight mb-2">
              Transform Your CV to ATS
            </h1>
            <p className="text-sm text-text-secondary">
              Upload your existing CV and we&apos;ll extract your details,
              then format them into a professional ATS-friendly layout.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            {/* Upload area */}
            {!file && !scanning && (
              <label className="flex flex-col items-center justify-center gap-4 p-10 border-2 border-dashed border-border rounded-xl bg-background cursor-pointer hover:border-brand/40 hover:bg-brand-light/20 transition-all">
                <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
                  <Upload className="w-6 h-6 text-brand" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold mb-1">Upload your CV</p>
                  <p className="text-xs text-text-muted">PDF, DOC, DOCX, or TXT</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleUpload}
                  className="hidden"
                />
              </label>
            )}

            {/* Scanning */}
            {scanning && (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Analysing {file}</p>
                    <p className="text-xs text-text-muted">Please wait...</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {scanSteps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {i < scanStep ? (
                        <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : i === scanStep ? (
                        <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border" />
                      )}
                      <span className={`text-sm ${i <= scanStep ? "text-foreground font-medium" : "text-text-muted"}`}>
                        {s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed result */}
            {parsed && !scanning && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file}</p>
                    <p className="text-xs text-text-muted">Scanned successfully</p>
                  </div>
                  <button
                    onClick={() => { setFile(""); setParsed(null); localStorage.removeItem(CV_TRANSFORM_KEY); }}
                    className="text-text-muted hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Extracted summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Extracted Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Name</span>
                      <p className="font-medium">{parsed.fullName || "—"}</p>
                    </div>
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Email</span>
                      <p className="font-medium truncate">{parsed.email || "—"}</p>
                    </div>
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Experience</span>
                      <p className="font-medium">{parsed.experience.length} role{parsed.experience.length !== 1 ? "s" : ""} found</p>
                    </div>
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Education</span>
                      <p className="font-medium">{parsed.education.length} qualification{parsed.education.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Skills</span>
                      <p className="font-medium">{parsed.skillGroups.length} group{parsed.skillGroups.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="bg-background rounded-lg p-2.5">
                      <span className="text-text-muted">Summary</span>
                      <p className="font-medium">{parsed.summary ? "Found" : "Not found"}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTransform}
                  className={cn(
                    buttonVariants(),
                    "bg-brand hover:bg-brand-mid text-white w-full gap-2"
                  )}
                >
                  <Sparkles className="w-4 h-4" /> Transform to ATS Format <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right panel — Preview */}
      <div className="hidden lg:flex flex-1 flex-col bg-[#f0efe9] items-center justify-center p-8">
        <div className="max-w-[400px] text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-light flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-brand" />
          </div>
          <h2 className="font-heading text-xl font-extrabold tracking-tight mb-3">
            How it works
          </h2>
          <div className="space-y-4 text-left">
            {[
              { step: "1", title: "Upload", desc: "Upload your existing CV in any format" },
              { step: "2", title: "Scan", desc: "We extract your details — name, experience, skills, education" },
              { step: "3", title: "Transform", desc: "Your content is loaded into our ATS-friendly CV builder" },
              { step: "4", title: "Download", desc: "Choose a template and download your new professional CV" },
            ].map((s) => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="text-xs text-text-secondary">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
