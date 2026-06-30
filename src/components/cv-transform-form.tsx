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
  "Extracting text content...",
  "Analysing CV structure with AI...",
  "Parsing experience & education...",
  "Formatting for ATS compliance...",
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

interface FileItem {
  id: string;
  name: string;
  status: "pending" | "scanning" | "done" | "error";
  scanStep: number;
  parsed: ParsedCv | null;
  error: string;
}

async function processFile(f: File): Promise<ParsedCv> {
  let text: string;
  if (f.name.toLowerCase().endsWith(".pdf")) {
    text = await extractTextFromPdf(f);
  } else {
    text = await f.text();
  }
  if (!text || text.trim().length < 20) throw new Error("Could not extract readable text.");

  const res = await fetch("/api/cv-transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const json = await res.json() as { error?: string };
    if (res.status === 503) return parseCvText(text);
    throw new Error(json.error ?? "AI parsing failed.");
  }
  const json = await res.json() as { result?: ParsedCv };
  if (!json.result) throw new Error("AI returned no data.");
  return json.result;
}

export function CvTransformForm() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const updateItem = useCallback((id: string, patch: Partial<FileItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const newItems: FileItem[] = files.map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      status: "pending",
      scanStep: 0,
      parsed: null,
      error: "",
    }));
    setItems((prev) => [...prev, ...newItems]);
    setProcessing(true);

    for (let i = 0; i < files.length; i++) {
      const item = newItems[i];
      updateItem(item.id, { status: "scanning", scanStep: 0 });

      // Animate scan steps
      for (let s = 0; s < scanSteps.length - 1; s++) {
        await new Promise((r) => setTimeout(r, 600));
        updateItem(item.id, { scanStep: s + 1 });
      }

      try {
        const parsed = await processFile(files[i]);
        updateItem(item.id, { status: "done", parsed, scanStep: scanSteps.length - 1 });
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to process.",
        });
      }
    }
    setProcessing(false);
  }, [updateItem]);

  const handleLoad = (parsed: ParsedCv) => {
    localStorage.setItem(CV_TRANSFORM_KEY, JSON.stringify(parsed));
    router.push("/cv-builder?transform=1");
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const doneCount = items.filter((it) => it.status === "done").length;
  const totalCount = items.length;

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
              Upload one or multiple CVs and we&apos;ll scan each one with AI,
              then load them into the ATS-friendly CV builder.
            </p>
          </div>

          <div className="space-y-4">
            {/* Upload area */}
            <label className="flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border rounded-2xl bg-card cursor-pointer hover:border-brand/40 hover:bg-brand-light/20 transition-all">
              <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
                <Upload className="w-6 h-6 text-brand" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1">
                  {processing ? "Adding more files..." : "Upload CVs"}
                </p>
                <p className="text-xs text-text-muted">Select one or multiple PDFs, DOC, DOCX, or TXT files</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
            </label>

            {/* Progress summary */}
            {items.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold">
                  {doneCount} of {totalCount} processed
                </span>
                {!processing && items.length > 0 && (
                  <button
                    onClick={() => setItems([])}
                    className="text-xs text-text-muted hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* File list */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  {/* File header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.status === "done" ? "bg-green-100" :
                      item.status === "error" ? "bg-red-100" :
                      "bg-brand-light"
                    }`}>
                      {item.status === "scanning" ? (
                        <Loader2 className="w-4 h-4 text-brand animate-spin" />
                      ) : item.status === "done" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : item.status === "error" ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-brand" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className={`text-xs ${
                        item.status === "done" ? "text-green-600" :
                        item.status === "error" ? "text-red-500" :
                        item.status === "scanning" ? "text-brand" :
                        "text-text-muted"
                      }`}>
                        {item.status === "pending" ? "Waiting..." :
                         item.status === "scanning" ? scanSteps[item.scanStep] :
                         item.status === "done" ? `✓ Ready — ${item.parsed?.fullName || "CV"}` :
                         item.error}
                      </p>
                    </div>
                    {(item.status === "done" || item.status === "error") && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Scan progress */}
                  {item.status === "scanning" && (
                    <div className="px-4 pb-4 space-y-1.5">
                      {scanSteps.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {i < item.scanStep ? (
                            <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : i === item.scanStep ? (
                            <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin flex-shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-border flex-shrink-0" />
                          )}
                          <span className={`text-xs ${i <= item.scanStep ? "text-foreground font-medium" : "text-text-muted"}`}>
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Done — extracted info + load button */}
                  {item.status === "done" && item.parsed && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-text-muted mb-0.5">Roles</p>
                          <p className="font-semibold">{item.parsed.experience.length}</p>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-text-muted mb-0.5">Education</p>
                          <p className="font-semibold">{item.parsed.education.length}</p>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <p className="text-text-muted mb-0.5">Skill groups</p>
                          <p className="font-semibold">{item.parsed.skillGroups.length}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoad(item.parsed!)}
                        className={cn(
                          buttonVariants(),
                          "bg-brand hover:bg-brand-mid text-white w-full gap-2 h-9 text-sm"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Load in CV Builder <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — How it works */}
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
              { step: "1", title: "Upload", desc: "Select one or multiple CVs at once — PDF, DOC, or TXT" },
              { step: "2", title: "AI Scan", desc: "Each CV is analysed by AI to extract name, experience, skills and education" },
              { step: "3", title: "Load", desc: "Click 'Load in CV Builder' on any CV to open it in the ATS builder" },
              { step: "4", title: "Download", desc: "Choose a template, enhance with AI, and download your ATS-ready CV" },
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
