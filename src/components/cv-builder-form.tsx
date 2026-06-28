"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Users,
  LayoutTemplate,
  Upload,
  ZoomIn,
  ZoomOut,
  X,
  Move,
} from "lucide-react";

type Template = "classic" | "modern" | "executive" | "minimal" | "bold" | "professional" | "creative" | "corporate";

const TEMPLATES: { id: Template; name: string; description: string; accent: string; font: string; hasPhoto?: boolean }[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional serif layout with black section dividers. Timeless and ATS-proven.",
    accent: "#1a1a1a",
    font: "Palatino Linotype",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Bold green header banner with clean sans-serif typography.",
    accent: "#1A5C3A",
    font: "Segoe UI",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Navy blue accents with a refined sidebar stripe for leadership roles.",
    accent: "#1B3A5C",
    font: "Georgia",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with subtle grey lines and maximum whitespace.",
    accent: "#888888",
    font: "Helvetica Neue",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Dark background with orange accents and circular photo. High visual impact.",
    accent: "#E8840C",
    font: "Segoe UI",
    hasPhoto: true,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Navy sidebar with gold accents and photo. Polished two-column layout.",
    accent: "#D4A017",
    font: "Segoe UI",
    hasPhoto: true,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Warm beige sidebar with black headings and circular photo. Distinctive and elegant.",
    accent: "#C8A84E",
    font: "Georgia",
    hasPhoto: true,
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Navy header and sidebar with circle photo. Clean and authoritative.",
    accent: "#1B3A5C",
    font: "Segoe UI",
    hasPhoto: true,
  },
];

interface WorkEntry {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

interface SkillGroup {
  category: string;
  skills: string;
}

interface RefereeEntry {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

interface CvData {
  fullName: string;
  tagline: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  photo: string;
  photoZoom: number;
  photoOffsetX: number;
  photoOffsetY: number;
  summary: string;
  experience: WorkEntry[];
  education: EducationEntry[];
  skillGroups: SkillGroup[];
  referees: RefereeEntry[];
  referencesUponRequest: boolean;
}

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Summary", icon: FileText },
  { label: "Experience", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Skills", icon: Wrench },
  { label: "References", icon: Users },
];

const emptyWork: WorkEntry = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
};

const emptyEducation: EducationEntry = {
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
};

const emptySkillGroup: SkillGroup = { category: "", skills: "" };

const emptyReferee: RefereeEntry = {
  name: "",
  title: "",
  company: "",
  email: "",
  phone: "",
};

const initial: CvData = {
  fullName: "",
  tagline: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  photo: "",
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
  summary: "",
  experience: [{ ...emptyWork, bullets: [""] }],
  education: [{ ...emptyEducation }],
  skillGroups: [{ ...emptySkillGroup }],
  referees: [{ ...emptyReferee }],
  referencesUponRequest: false,
};

export function CvBuilderForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CvData>(initial);
  const [template, setTemplate] = useState<Template>("classic");
  const [showTemplates, setShowTemplates] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateExperience(index: number, patch: Partial<WorkEntry>) {
    const next = data.experience.map((e, i) =>
      i === index ? { ...e, ...patch } : e
    );
    update("experience", next);
  }

  function updateEducation(index: number, patch: Partial<EducationEntry>) {
    const next = data.education.map((e, i) =>
      i === index ? { ...e, ...patch } : e
    );
    update("education", next);
  }

  function updateSkillGroup(index: number, patch: Partial<SkillGroup>) {
    const next = data.skillGroups.map((g, i) =>
      i === index ? { ...g, ...patch } : g
    );
    update("skillGroups", next);
  }

  function updateReferee(index: number, patch: Partial<RefereeEntry>) {
    const next = data.referees.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    );
    update("referees", next);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("photo", reader.result as string);
    reader.readAsDataURL(file);
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);
  const needsPhoto = selectedTemplate?.hasPhoto;

  function updateBullet(expIndex: number, bulletIndex: number, value: string) {
    const next = data.experience.map((e, i) => {
      if (i !== expIndex) return e;
      const bullets = e.bullets.map((b, j) => (j === bulletIndex ? value : b));
      return { ...e, bullets };
    });
    update("experience", next);
  }

  function addBullet(expIndex: number) {
    const next = data.experience.map((e, i) =>
      i === expIndex ? { ...e, bullets: [...e.bullets, ""] } : e
    );
    update("experience", next);
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    const next = data.experience.map((e, i) =>
      i === expIndex
        ? { ...e, bullets: e.bullets.filter((_, j) => j !== bulletIndex) }
        : e
    );
    update("experience", next);
  }

  function handlePrint() {
    const el = previewRef.current;
    if (!el) return;

    import("@/lib/analytics").then(({ trackCvDownload }) => {
      trackCvDownload({ name: data.fullName, template });
    });

    const win = window.open("", "_blank");
    if (!win) return;

    const printStyles: Record<Template, string> = {
      classic: `
body{font-family:'Palatino Linotype','Times New Roman',serif;font-size:10pt;color:#1a1a1a;padding:0.25in;line-height:1.5;text-align:justify}
h1{font-size:22pt;font-weight:700;margin-bottom:2px;text-align:left;color:#1B3A5C}
h2{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;border-bottom:1.5px solid #1a1a1a;padding-bottom:3px;margin:16px 0 10px;text-align:left}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{padding:0.25in}@page{margin:0.25in}}`,
      modern: `
body{font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:10pt;color:#2d2d2d;padding:0;line-height:1.5;text-align:justify}
.modern-header{background:#1A5C3A;color:#fff;padding:0.25in}
.modern-header h1{color:#fff;text-align:left}
.modern-body{padding:0.25in}
h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1A5C3A;border-bottom:2px solid #1A5C3A;padding-bottom:4px;margin:20px 0 10px;text-align:left}
ul{list-style:none;padding-left:0;margin-top:3px}
li{margin-bottom:3px;font-size:9.5pt;padding-left:14px;position:relative}
li::before{content:'';position:absolute;left:0;top:7px;width:5px;height:5px;border-radius:50%;background:#1A5C3A}
@media print{.modern-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:0}@page{margin:0}}`,
      executive: `
body{font-family:Georgia,'Times New Roman',serif;font-size:10pt;color:#1a1a1a;padding:0;line-height:1.5;text-align:justify}
.exec-stripe{position:absolute;left:0;top:0;bottom:0;width:6px;background:#1B3A5C}
.exec-wrap{position:relative;padding:0.25in 0.25in 0.25in calc(0.25in + 6px)}
h1{font-size:22pt;font-weight:700;color:#1B3A5C;margin-bottom:2px;text-align:left}
h2{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1B3A5C;border-bottom:2px solid #1B3A5C;padding-bottom:3px;margin:18px 0 10px;text-align:left}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{.exec-stripe{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{padding:0}@page{margin:0}}`,
      minimal: `
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10pt;color:#333;padding:0.25in;line-height:1.6;text-align:justify}
h1{font-size:20pt;font-weight:400;letter-spacing:2px;text-transform:uppercase;margin-bottom:2px;text-align:left}
h2{font-size:9pt;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:#888;border-bottom:1px solid #ddd;padding-bottom:4px;margin:20px 0 10px;text-align:left}
ul{list-style:none;padding-left:0;margin-top:3px}
li{margin-bottom:3px;font-size:9.5pt;padding-left:12px;position:relative}
li::before{content:'–';position:absolute;left:0;color:#aaa}
@media print{body{padding:0.25in}@page{margin:0.25in}}`,
      bold: `
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#fff;padding:0;margin:0;line-height:1.5;background:#2D2D2D;text-align:justify}
img{border-radius:50%}
h2{color:#E8840C;text-align:left}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0}}`,
      professional: `
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1a1a1a;padding:0;margin:0;line-height:1.5;text-align:justify}
img{border-radius:50%}
h2{color:#D4A017;text-align:left}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0}}`,
      creative: `
body{font-family:Georgia,serif;font-size:10pt;color:#1a1a1a;padding:0;margin:0;line-height:1.5;text-align:justify}
img{border-radius:50%}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0}}`,
      corporate: `
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1a1a1a;padding:0;margin:0;line-height:1.5;text-align:justify}
img{border-radius:50%}
h2{color:#1B3A5C;text-align:left}
ul{list-style:disc;padding-left:18px;margin-top:3px}
li{margin-bottom:2px;font-size:9.5pt}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{margin:0}}`,
    };

    win.document.write(`<!DOCTYPE html><html><head><title>${data.fullName || "CV"}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}${printStyles[template]}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  }

  const canGoNext = () => {
    if (step === 0) return data.fullName.trim() && data.email.trim();
    if (step === 1) return data.summary.trim();
    return true;
  };

  const hasContent =
    data.fullName ||
    data.summary ||
    data.experience.some((e) => e.company || e.role) ||
    data.education.some((e) => e.institution || e.degree) ||
    data.skillGroups.some((g) => g.category && g.skills);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel — Form */}
      <div className="w-full lg:w-1/2 overflow-y-auto border-r border-border bg-background">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
              CV Builder
            </p>
            <h1 className="font-heading text-2xl font-black tracking-tight leading-tight mb-2">
              Build your ATS-friendly CV
            </h1>
            <p className="text-sm text-text-secondary">
              Fill in each section — your CV updates live on the right.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8 flex-wrap">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => i <= step && setStep(i)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  i === step
                    ? "bg-brand text-white"
                    : i < step
                      ? "bg-brand-light text-brand cursor-pointer"
                      : "bg-card text-text-muted border border-border cursor-default"
                )}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step content */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Personal details
                </h2>
                <p className="text-sm text-text-secondary">
                  This information appears at the top of your CV.
                </p>

                {needsPhoto && (
                  <div className="border border-border rounded-xl p-4 bg-background space-y-3">
                    <span className="text-sm font-medium">Profile photo</span>
                    <div className="flex items-start gap-4">
                      {/* Preview circle */}
                      <div className="w-24 h-24 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                        {data.photo ? (
                          <img
                            src={data.photo}
                            alt="Profile"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transform: `scale(${data.photoZoom}) translate(${data.photoOffsetX}%, ${data.photoOffsetY}%)`,
                            }}
                          />
                        ) : (
                          <User className="w-10 h-10 text-text-muted" />
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Upload / Remove buttons */}
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium cursor-pointer hover:bg-card transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {data.photo ? "Change" : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>
                          {data.photo && (
                            <button
                              onClick={() => update("photo", "")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Remove
                            </button>
                          )}
                        </div>

                        {/* Zoom + Position controls */}
                        {data.photo && (
                          <div className="space-y-2">
                            {/* Zoom */}
                            <div className="flex items-center gap-2">
                              <ZoomOut className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                              <input
                                type="range"
                                min="1"
                                max="2.5"
                                step="0.05"
                                value={data.photoZoom}
                                onChange={(e) => update("photoZoom", parseFloat(e.target.value))}
                                className="flex-1 accent-brand h-1.5"
                              />
                              <ZoomIn className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                            </div>
                            {/* Position */}
                            <div className="flex items-center gap-3">
                              <Move className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <span>X</span>
                                <input
                                  type="range"
                                  min="-30"
                                  max="30"
                                  step="1"
                                  value={data.photoOffsetX}
                                  onChange={(e) => update("photoOffsetX", parseFloat(e.target.value))}
                                  className="w-20 accent-brand h-1.5"
                                />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                <span>Y</span>
                                <input
                                  type="range"
                                  min="-30"
                                  max="30"
                                  step="1"
                                  value={data.photoOffsetY}
                                  onChange={(e) => update("photoOffsetY", parseFloat(e.target.value))}
                                  className="w-20 accent-brand h-1.5"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">
                      Full name <span className="text-red-500">*</span>
                    </span>
                    <Input
                      value={data.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      placeholder="Josiah Mwangi"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Professional tagline</span>
                    <Input
                      value={data.tagline}
                      onChange={(e) => update("tagline", e.target.value)}
                      placeholder="Senior Software Engineer | Cloud & DevOps"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">
                      Email <span className="text-red-500">*</span>
                    </span>
                    <Input
                      type="email"
                      value={data.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="josiah@example.com"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Phone</span>
                    <Input
                      value={data.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+254 700 000 000"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">Location</span>
                    <Input
                      value={data.location}
                      onChange={(e) => update("location", e.target.value)}
                      placeholder="Nairobi, Kenya"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium">LinkedIn URL</span>
                    <Input
                      value={data.linkedin}
                      onChange={(e) => update("linkedin", e.target.value)}
                      placeholder="linkedin.com/in/josiah-mwangi"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Professional summary
                </h2>
                <p className="text-sm text-text-secondary">
                  Write 4–6 sentences highlighting your experience, key skills,
                  and career strengths. Include keywords from your target job
                  description for ATS optimisation.
                </p>
                <Textarea
                  value={data.summary}
                  onChange={(e) => update("summary", e.target.value)}
                  placeholder="Results-driven software engineer with 8+ years of experience building scalable web applications..."
                  className="min-h-[160px]"
                />
                <p className="text-xs text-text-muted">
                  Tip: Mention your years of experience, core domain, 2–3
                  signature skills, and the type of impact you deliver.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Professional experience
                </h2>
                <p className="text-sm text-text-secondary">
                  List roles in reverse chronological order. Use action verbs and
                  quantify outcomes.
                </p>

                {data.experience.map((exp, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Role {i + 1}
                      </span>
                      {data.experience.length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "experience",
                              data.experience.filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Company</span>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(i, { company: e.target.value })
                          }
                          placeholder="Acme Corp"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Job title</span>
                        <Input
                          value={exp.role}
                          onChange={(e) =>
                            updateExperience(i, { role: e.target.value })
                          }
                          placeholder="Senior Software Engineer"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Start date</span>
                        <Input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(i, { startDate: e.target.value })
                          }
                        />
                      </label>
                      <div className="space-y-1.5">
                        <span className="text-sm font-medium">End date</span>
                        {exp.current ? (
                          <div className="h-8 flex items-center text-sm text-brand font-medium">
                            Present
                          </div>
                        ) : (
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateExperience(i, { endDate: e.target.value })
                            }
                          />
                        )}
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) =>
                              updateExperience(i, {
                                current: e.target.checked,
                                endDate: "",
                              })
                            }
                            className="accent-brand"
                          />
                          I currently work here
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Key achievements / responsibilities
                      </span>
                      {exp.bullets.map((bullet, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="mt-2 text-text-muted text-sm">
                            •
                          </span>
                          <Input
                            value={bullet}
                            onChange={(e) => updateBullet(i, j, e.target.value)}
                            placeholder="Led migration to microservices, reducing deploy time by 40%"
                            className="flex-1"
                          />
                          {exp.bullets.length > 1 && (
                            <button
                              onClick={() => removeBullet(i, j)}
                              className="text-red-400 hover:text-red-600 transition-colors mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addBullet(i)}
                        className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("experience", [
                      ...data.experience,
                      { ...emptyWork, bullets: [""] },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add another role
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Education
                </h2>
                <p className="text-sm text-text-secondary">
                  Include degrees, diplomas, and relevant certifications.
                </p>

                {data.education.map((edu, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Qualification {i + 1}
                      </span>
                      {data.education.length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "education",
                              data.education.filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Institution</span>
                        <Input
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(i, { institution: e.target.value })
                          }
                          placeholder="University of Nairobi"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Degree / Certificate
                        </span>
                        <Input
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(i, { degree: e.target.value })
                          }
                          placeholder="Bachelor of Science"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Field of study
                        </span>
                        <Input
                          value={edu.field}
                          onChange={(e) =>
                            updateEducation(i, { field: e.target.value })
                          }
                          placeholder="Computer Science"
                        />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium">Start</span>
                          <Input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) =>
                              updateEducation(i, { startDate: e.target.value })
                            }
                          />
                        </label>
                        <label className="space-y-1.5">
                          <span className="text-sm font-medium">End</span>
                          <Input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) =>
                              updateEducation(i, { endDate: e.target.value })
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("education", [
                      ...data.education,
                      { ...emptyEducation },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add another qualification
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Core skills
                </h2>
                <p className="text-sm text-text-secondary">
                  Group your skills into 4–6 categories. Separate individual
                  skills with a middle dot ( · ) for clean formatting. Use
                  keywords from your target job description for best ATS results.
                </p>

                {data.skillGroups.map((group, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="grid sm:grid-cols-[180px_1fr] gap-3 flex-1">
                      <Input
                        value={group.category}
                        onChange={(e) =>
                          updateSkillGroup(i, { category: e.target.value })
                        }
                        placeholder="Category (e.g. Languages)"
                      />
                      <Input
                        value={group.skills}
                        onChange={(e) =>
                          updateSkillGroup(i, { skills: e.target.value })
                        }
                        placeholder="JavaScript · TypeScript · Python · Go"
                      />
                    </div>
                    {data.skillGroups.length > 1 && (
                      <button
                        onClick={() =>
                          update(
                            "skillGroups",
                            data.skillGroups.filter((_, j) => j !== i)
                          )
                        }
                        className="text-red-400 hover:text-red-600 transition-colors mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("skillGroups", [
                      ...data.skillGroups,
                      { ...emptySkillGroup },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add skill category
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  References
                </h2>
                <p className="text-sm text-text-secondary">
                  Add professional referees, or choose to display
                  &ldquo;References provided upon request&rdquo; instead.
                </p>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.referencesUponRequest}
                    onChange={(e) =>
                      update("referencesUponRequest", e.target.checked)
                    }
                    className="accent-brand w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    References provided upon request
                  </span>
                </label>

                {!data.referencesUponRequest && (
                  <>
                    {data.referees.map((ref, i) => (
                      <div
                        key={i}
                        className="border border-border rounded-xl p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-text-secondary">
                            Referee {i + 1}
                          </span>
                          {data.referees.length > 1 && (
                            <button
                              onClick={() =>
                                update(
                                  "referees",
                                  data.referees.filter((_, j) => j !== i)
                                )
                              }
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Full name</span>
                            <Input
                              value={ref.name}
                              onChange={(e) =>
                                updateReferee(i, { name: e.target.value })
                              }
                              placeholder="Dr. Amina Osei"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Job title</span>
                            <Input
                              value={ref.title}
                              onChange={(e) =>
                                updateReferee(i, { title: e.target.value })
                              }
                              placeholder="Engineering Director"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Company / Organisation</span>
                            <Input
                              value={ref.company}
                              onChange={(e) =>
                                updateReferee(i, { company: e.target.value })
                              }
                              placeholder="Safaricom PLC"
                            />
                          </label>
                          <label className="space-y-1.5">
                            <span className="text-sm font-medium">Email</span>
                            <Input
                              type="email"
                              value={ref.email}
                              onChange={(e) =>
                                updateReferee(i, { email: e.target.value })
                              }
                              placeholder="a.osei@safaricom.co.ke"
                            />
                          </label>
                          <label className="space-y-1.5 sm:col-span-2">
                            <span className="text-sm font-medium">Phone</span>
                            <Input
                              value={ref.phone}
                              onChange={(e) =>
                                updateReferee(i, { phone: e.target.value })
                              }
                              placeholder="+254 720 111 222"
                            />
                          </label>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        update("referees", [
                          ...data.referees,
                          { ...emptyReferee },
                        ])
                      }
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full gap-2"
                      )}
                    >
                      <Plus className="w-4 h-4" /> Add another referee
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2",
                step === 0 && "invisible"
              )}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canGoNext()}
                className={cn(
                  buttonVariants(),
                  "bg-brand hover:bg-brand-mid text-white gap-2 disabled:opacity-40"
                )}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className={cn(
                  buttonVariants(),
                  "bg-brand hover:bg-brand-mid text-white gap-2"
                )}
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[860px] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Choose a template
                </h2>
                <p className="text-sm text-text-secondary">
                  Select a design that fits your style and industry.
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-text-muted hover:text-foreground text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 max-h-[70vh] overflow-y-auto">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTemplate(t.id);
                    setShowTemplates(false);
                  }}
                  className={cn(
                    "text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-md",
                    template === t.id
                      ? "border-brand shadow-[0_0_0_3px_var(--brand-light)]"
                      : "border-border hover:border-gray-300"
                  )}
                >
                  <div className="h-[120px] bg-white relative overflow-hidden">
                    <TemplateThumbnail id={t.id} accent={t.accent} />
                    {template === t.id && (
                      <div className="absolute top-1.5 right-1.5 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        Active
                      </div>
                    )}
                    {t.hasPhoto && (
                      <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <User className="w-2.5 h-2.5" /> Photo
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-semibold mb-0.5">{t.name}</div>
                    <p className="text-[10px] text-text-secondary leading-snug">
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right panel — Live preview */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-[#f0efe9] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card gap-3">
          <span className="text-sm font-semibold text-text-secondary flex-shrink-0">
            Live Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs gap-1.5"
              )}
            >
              <LayoutTemplate className="w-3.5 h-3.5" /> Choose Template
            </button>
            <button
              onClick={handlePrint}
              disabled={!hasContent}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-8 text-xs gap-1.5 disabled:opacity-40"
              )}
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div
            ref={previewRef}
            className="bg-white rounded-lg shadow-md mx-auto overflow-hidden"
            style={{ maxWidth: 680, minHeight: 900 }}
          >
            {!hasContent ? (
              <div className="flex flex-col items-center justify-center h-[600px] text-center text-text-muted p-12">
                <FileText className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">
                  Start filling in the form on the left.
                  <br />
                  Your CV will appear here in real time.
                </p>
              </div>
            ) : (
              <>
                {template === "classic" && <ClassicPreview data={data} />}
                {template === "modern" && <ModernPreview data={data} />}
                {template === "executive" && <ExecutivePreview data={data} />}
                {template === "minimal" && <MinimalPreview data={data} />}
                {template === "bold" && <BoldPreview data={data} />}
                {template === "professional" && <ProfessionalPreview data={data} />}
                {template === "creative" && <CreativePreview data={data} />}
                {template === "corporate" && <CorporatePreview data={data} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

/* ── Shared preview helpers ─────────────────────────────── */

function ExperienceEntries({ data }: { data: CvData }) {
  return (
    <>
      {data.experience
        .filter((e) => e.company || e.role)
        .map((exp, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "10pt" }}>
                  {exp.role}
                </span>
                {exp.company && (
                  <span style={{ fontSize: "9.5pt", color: "#555" }}>
                    {" "}— {exp.company}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "8.5pt",
                  color: "#777",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(exp.startDate)} –{" "}
                {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            {exp.bullets.some((b) => b.trim()) && (
              <ul style={{ marginTop: 3 }}>
                {exp.bullets
                  .filter((b) => b.trim())
                  .map((b, j) => (
                    <li
                      key={j}
                      style={{ marginBottom: 2, fontSize: "9.5pt" }}
                    >
                      {b}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
    </>
  );
}

function EducationEntries({ data }: { data: CvData }) {
  return (
    <>
      {data.education
        .filter((e) => e.institution || e.degree)
        .map((edu, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: "10pt" }}>
                  {edu.degree}
                  {edu.field && ` in ${edu.field}`}
                </span>
                {edu.institution && (
                  <span style={{ fontSize: "9.5pt", color: "#555" }}>
                    {" "}— {edu.institution}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: "8.5pt",
                  color: "#777",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
              </span>
            </div>
          </div>
        ))}
    </>
  );
}

function SkillRows({ data }: { data: CvData }) {
  return (
    <div>
      {data.skillGroups
        .filter((g) => g.category && g.skills)
        .map((g, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "9.5pt",
                minWidth: 180,
                flexShrink: 0,
              }}
            >
              {g.category}
            </span>
            <span style={{ fontSize: "9.5pt" }}>{g.skills}</span>
          </div>
        ))}
    </div>
  );
}

function ReferencesBlock({ data }: { data: CvData }) {
  if (data.referencesUponRequest) {
    return (
      <p style={{ fontSize: "9.5pt", fontStyle: "italic", color: "#555" }}>
        References provided upon request.
      </p>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "12px 24px",
      }}
    >
      {data.referees
        .filter((r) => r.name)
        .map((ref, i) => (
          <div key={i}>
            <div style={{ fontWeight: 700, fontSize: "9.5pt" }}>
              {ref.name}
            </div>
            {(ref.title || ref.company) && (
              <div style={{ fontSize: "9pt", color: "#555" }}>
                {ref.title}
                {ref.title && ref.company && ", "}
                {ref.company}
              </div>
            )}
            {ref.email && (
              <div style={{ fontSize: "9pt", color: "#555" }}>{ref.email}</div>
            )}
            {ref.phone && (
              <div style={{ fontSize: "9pt", color: "#555" }}>{ref.phone}</div>
            )}
          </div>
        ))}
    </div>
  );
}

function hasRefs(data: CvData) {
  return data.referencesUponRequest || data.referees.some((r) => r.name);
}

/* ── Classic template ────────────────────────────────────── */

function ClassicSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        borderBottom: "1.5px solid #1a1a1a",
        paddingBottom: 3,
        margin: "16px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ClassicPreview({ data }: { data: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Palatino Linotype', 'Times New Roman', serif",
        padding: 24,
        textAlign: "justify" as const,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, marginBottom: 18, borderBottom: "2px solid #1B3A5C", paddingBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#1B3A5C", textAlign: "left" }}>
            {data.fullName || "Your Name"}
          </h1>
          {data.tagline && (
            <div style={{ fontSize: "10pt", color: "#666", lineHeight: 1.4 }}>
              {data.tagline}
            </div>
          )}
        </div>
        <div style={{ fontSize: "8.5pt", color: "#555", textAlign: "right", lineHeight: 1.7, whiteSpace: "nowrap", flexShrink: 0, paddingTop: 4 }}>
          {[data.phone, data.email, data.linkedin, data.location]
            .filter(Boolean)
            .map((item, i) => (
              <div key={i}>{item}</div>
            ))}
        </div>
      </div>

      {data.summary && (
        <>
          <ClassicSectionHeading>Professional Summary</ClassicSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.6 }}>{data.summary}</p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <ClassicSectionHeading>Professional Experience</ClassicSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <ClassicSectionHeading>Education</ClassicSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ClassicSectionHeading>Core Skills</ClassicSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ClassicSectionHeading>References</ClassicSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Modern template ─────────────────────────────────────── */

function ModernSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#1A5C3A",
        borderBottom: "2px solid #1A5C3A",
        paddingBottom: 4,
        margin: "20px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ModernPreview({ data }: { data: CvData }) {
  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Colored header */}
      <div
        className="modern-header"
        style={{
          background: "#1A5C3A",
          color: "#fff",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#fff" }}>
          {data.fullName || "Your Name"}
        </h1>
        {data.tagline && (
          <div
            className="tagline"
            style={{
              fontSize: "10pt",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 6,
            }}
          >
            {data.tagline}
          </div>
        )}
        <div
          className="contact"
          style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.7)" }}
        >
          {[data.email, data.phone, data.location, data.linkedin]
            .filter(Boolean)
            .join("  |  ")}
        </div>
      </div>

      {/* Body */}
      <div className="modern-body" style={{ padding: 24, textAlign: "justify" as const }}>
        {data.summary && (
          <>
            <ModernSectionHeading>Professional Summary</ModernSectionHeading>
            <p style={{ fontSize: "9.5pt", lineHeight: 1.65, color: "#2d2d2d" }}>
              {data.summary}
            </p>
          </>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <>
            <ModernSectionHeading>Professional Experience</ModernSectionHeading>
            <ExperienceEntries data={data} />
          </>
        )}

        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <ModernSectionHeading>Education</ModernSectionHeading>
            <EducationEntries data={data} />
          </>
        )}

        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <ModernSectionHeading>Core Skills</ModernSectionHeading>
            <div>
              {data.skillGroups
                .filter((g) => g.category && g.skills)
                .map((g, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "9.5pt",
                        color: "#1A5C3A",
                        minWidth: 180,
                        flexShrink: 0,
                      }}
                    >
                      {g.category}
                    </span>
                    <span style={{ fontSize: "9.5pt", color: "#2d2d2d" }}>
                      {g.skills}
                    </span>
                  </div>
                ))}
            </div>
          </>
        )}

        {hasRefs(data) && (
          <>
            <ModernSectionHeading>References</ModernSectionHeading>
            <ReferencesBlock data={data} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Executive template ──────────────────────────────────── */

function ExecSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#1B3A5C",
        borderBottom: "2px solid #1B3A5C",
        paddingBottom: 3,
        margin: "18px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function ExecutivePreview({ data }: { data: CvData }) {
  return (
    <div
      className="exec-wrap"
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
        padding: "24px 24px 24px 30px",
        textAlign: "justify" as const,
      }}
    >
      <div
        className="exec-stripe"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: "#1B3A5C",
        }}
      />

      <h1 style={{ fontSize: "22pt", fontWeight: 700, marginBottom: 2, color: "#1B3A5C" }}>
        {data.fullName || "Your Name"}
      </h1>
      {data.tagline && (
        <div style={{ fontSize: "10pt", color: "#555", marginBottom: 6 }}>
          {data.tagline}
        </div>
      )}
      <div style={{ fontSize: "8.5pt", color: "#555", marginBottom: 18 }}>
        {[data.email, data.phone, data.location, data.linkedin]
          .filter(Boolean)
          .join("  |  ")}
      </div>

      {data.summary && (
        <>
          <ExecSectionHeading>Professional Summary</ExecSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.6 }}>{data.summary}</p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <ExecSectionHeading>Professional Experience</ExecSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <ExecSectionHeading>Education</ExecSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ExecSectionHeading>Core Skills</ExecSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ExecSectionHeading>References</ExecSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Minimal template ────────────────────────────────────── */

function MinimalSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "9pt",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "2px",
        color: "#888",
        borderBottom: "1px solid #ddd",
        paddingBottom: 4,
        margin: "20px 0 10px",
      }}
    >
      {children}
    </h2>
  );
}

function MinimalPreview({ data }: { data: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: 24,
        textAlign: "justify" as const,
        color: "#333",
      }}
    >
      <h1
        style={{
          fontSize: "20pt",
          fontWeight: 400,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {data.fullName || "Your Name"}
      </h1>
      {data.tagline && (
        <div style={{ fontSize: "10pt", color: "#888", marginBottom: 6 }}>
          {data.tagline}
        </div>
      )}
      <div style={{ fontSize: "8.5pt", color: "#999", marginBottom: 20 }}>
        {[data.email, data.phone, data.location, data.linkedin]
          .filter(Boolean)
          .join("  |  ")}
      </div>

      {data.summary && (
        <>
          <MinimalSectionHeading>Summary</MinimalSectionHeading>
          <p style={{ fontSize: "9.5pt", lineHeight: 1.7, color: "#444" }}>
            {data.summary}
          </p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <MinimalSectionHeading>Experience</MinimalSectionHeading>
          <ExperienceEntries data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <MinimalSectionHeading>Education</MinimalSectionHeading>
          <EducationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <MinimalSectionHeading>Skills</MinimalSectionHeading>
          <div>
            {data.skillGroups
              .filter((g) => g.category && g.skills)
              .map((g, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "9pt",
                      color: "#888",
                      minWidth: 160,
                      flexShrink: 0,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {g.category}
                  </span>
                  <span style={{ fontSize: "9.5pt", color: "#444" }}>
                    {g.skills}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}

      {hasRefs(data) && (
        <>
          <MinimalSectionHeading>References</MinimalSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
    </div>
  );
}

/* ── Template thumbnails for the picker modal ────────────── */

function TemplateThumbnail({ id, accent }: { id: Template; accent: string }) {
  const lineW = ["60%", "90%", "75%", "85%", "50%"];

  if (id === "modern") {
    return (
      <div style={{ height: "100%" }}>
        <div style={{ background: accent, padding: "12px 16px 10px" }}>
          <div style={{ height: 8, width: "50%", background: "rgba(255,255,255,0.9)", borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 4, width: "35%", background: "rgba(255,255,255,0.5)", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 3, width: "70%", background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div style={{ height: 4, width: "30%", background: accent, borderRadius: 2, marginBottom: 6 }} />
          {lineW.map((w, i) => (
            <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "executive") {
    return (
      <div style={{ height: "100%", position: "relative", padding: "14px 16px 14px 22px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
        <div style={{ height: 8, width: "50%", background: accent, borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />
        <div style={{ height: 4, width: "35%", background: "#ccc", borderRadius: 2, marginBottom: 8 }} />
        <div style={{ height: 4, width: "25%", background: accent, borderRadius: 2, marginBottom: 5, opacity: 0.6 }} />
        {lineW.map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
        ))}
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div style={{ height: "100%", padding: "16px 16px" }}>
        <div style={{ height: 7, width: "45%", background: "#ccc", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 3, width: "30%", background: "#ddd", borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 1, width: "100%", background: "#eee", marginBottom: 6 }} />
        {lineW.map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#ebebeb", borderRadius: 2, marginBottom: 3 }} />
        ))}
        <div style={{ height: 1, width: "100%", background: "#eee", marginTop: 4, marginBottom: 6 }} />
        {lineW.slice(0, 3).map((w, i) => (
          <div key={i} style={{ height: 3, width: w, background: "#ebebeb", borderRadius: 2, marginBottom: 3 }} />
        ))}
      </div>
    );
  }

  if (id === "bold") {
    return (
      <div style={{ height: "100%", background: "#2D2D2D", padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#555", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 6, width: "60%", background: "#fff", borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 3, width: "40%", background: accent, borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ height: 3, width: "25%", background: accent, borderRadius: 2, marginBottom: 4 }} />
        {lineW.slice(0, 4).map((w, i) => (
          <div key={i} style={{ height: 2.5, width: w, background: "#555", borderRadius: 2, marginBottom: 2.5 }} />
        ))}
      </div>
    );
  }

  if (id === "professional") {
    return (
      <div style={{ height: "100%", display: "flex" }}>
        <div style={{ width: "35%", background: "#1B2838", padding: "10px 8px" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#2a4060", margin: "0 auto 6px" }} />
          <div style={{ height: 3, width: "80%", background: "#3a5575", borderRadius: 2, marginBottom: 3, marginLeft: "auto", marginRight: "auto" }} />
          <div style={{ height: 3, width: "60%", background: "#3a5575", borderRadius: 2, marginLeft: "auto", marginRight: "auto" }} />
        </div>
        <div style={{ flex: 1, padding: "10px 10px" }}>
          <div style={{ height: 6, width: "50%", background: "#1a1a1a", borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 3, width: "25%", background: accent, borderRadius: 2, marginBottom: 5 }} />
          {lineW.slice(0, 4).map((w, i) => (
            <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "creative") {
    return (
      <div style={{ height: "100%", display: "flex" }}>
        <div style={{ width: "38%", background: "#F5F0E8", padding: "12px 8px", textAlign: "center" as const }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ddd5c5", margin: "0 auto 6px" }} />
          <div style={{ height: 4, width: "70%", background: "#1a1a1a", borderRadius: 2, marginBottom: 3, marginLeft: "auto", marginRight: "auto" }} />
          <div style={{ height: 3, width: "50%", background: "#bbb", borderRadius: 2, marginLeft: "auto", marginRight: "auto" }} />
        </div>
        <div style={{ flex: 1, padding: "12px 10px" }}>
          <div style={{ height: 4, width: "35%", background: accent, borderRadius: 2, marginBottom: 5 }} />
          {lineW.slice(0, 4).map((w, i) => (
            <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (id === "corporate") {
    return (
      <div style={{ height: "100%" }}>
        <div style={{ background: accent, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
          <div>
            <div style={{ height: 5, width: 60, background: "rgba(255,255,255,0.9)", borderRadius: 2, marginBottom: 2 }} />
            <div style={{ height: 3, width: 40, background: "rgba(255,255,255,0.4)", borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ display: "flex", flex: 1 }}>
          <div style={{ width: "30%", background: "#e8ecf0", padding: "6px 6px" }}>
            {[30, 20, 25].map((w, i) => (
              <div key={i} style={{ height: 2.5, width: `${w}px`, background: "#c5cdd5", borderRadius: 2, marginBottom: 3 }} />
            ))}
          </div>
          <div style={{ flex: 1, padding: "6px 8px" }}>
            {lineW.slice(0, 4).map((w, i) => (
              <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // classic
  return (
    <div style={{ height: "100%", padding: "14px 16px" }}>
      <div style={{ height: 8, width: "50%", background: accent, borderRadius: 2, marginBottom: 4 }} />
      <div style={{ height: 4, width: "35%", background: "#ccc", borderRadius: 2, marginBottom: 8 }} />
      <div style={{ height: 4, width: "25%", background: accent, borderRadius: 2, marginBottom: 2 }} />
      <div style={{ height: 1, width: "100%", background: accent, marginBottom: 5 }} />
      {lineW.map((w, i) => (
        <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
      ))}
      <div style={{ height: 4, width: "30%", background: accent, borderRadius: 2, marginTop: 4, marginBottom: 2 }} />
      <div style={{ height: 1, width: "100%", background: accent, marginBottom: 5 }} />
      {lineW.slice(0, 3).map((w, i) => (
        <div key={i} style={{ height: 3, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 3 }} />
      ))}
    </div>
  );
}

/* ── Photo circle helper ─────────────────────────────────── */

function PhotoCircle({ photo, zoom = 1, offsetX = 0, offsetY = 0, size = 120, border = "4px solid #fff", placeholderBg = "#ccc", placeholderIcon = "#999" }: { photo: string; zoom?: number; offsetX?: number; offsetY?: number; size?: number; border?: string; placeholderBg?: string; placeholderIcon?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border,
        overflow: "hidden",
        flexShrink: 0,
        background: placeholderBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {photo ? (
        <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translate(${offsetX}%, ${offsetY}%)` }} />
      ) : (
        <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke={placeholderIcon} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  );
}

/* ── Sidebar contact block ───────────────────────────────── */

function SidebarContact({ data, color = "#fff", muted = "rgba(255,255,255,0.7)" }: { data: CvData; color?: string; muted?: string }) {
  const items = [
    data.email && { label: "Email", value: data.email },
    data.phone && { label: "Phone", value: data.phone },
    data.location && { label: "Location", value: data.location },
    data.linkedin && { label: "Web", value: data.linkedin },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: "7.5pt", textTransform: "uppercase", letterSpacing: "1px", color: muted, marginBottom: 1 }}>{item.label}</div>
          <div style={{ fontSize: "8.5pt", color, wordBreak: "break-all" }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Bold template (dark bg + orange) ────────────────────── */

function BoldPreview({ data }: { data: CvData }) {
  const accent = "#E8840C";
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#2D2D2D", color: "#fff", minHeight: 900 }}>
      {/* Header */}
      <div style={{ background: "#363636", padding: 24, display: "flex", alignItems: "center", gap: 24 }}>
        <PhotoCircle photo={data.photo} zoom={data.photoZoom} offsetX={data.photoOffsetX} offsetY={data.photoOffsetY} size={100} border={`4px solid ${accent}`} placeholderBg="#555" placeholderIcon="#888" />
        <div>
          <h1 style={{ fontSize: "22pt", fontWeight: 700, color: "#fff", marginBottom: 2 }}>
            {data.fullName || "Your Name"}
          </h1>
          {data.tagline && (
            <div style={{ fontSize: "10pt", color: accent, marginBottom: 4 }}>{data.tagline}</div>
          )}
          <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.6)" }}>
            {[data.email, data.phone, data.location].filter(Boolean).join("  |  ")}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, textAlign: "justify" as const }}>
        {data.summary && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "12px 0 10px" }}>
              Professional Summary
            </h2>
            <p style={{ fontSize: "9.5pt", lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>{data.summary}</p>
          </>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              Experience
            </h2>
            <ExperienceEntries data={data} />
          </>
        )}

        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              Education
            </h2>
            <EducationEntries data={data} />
          </>
        )}

        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              Core Skills
            </h2>
            <div>
              {data.skillGroups.filter((g) => g.category && g.skills).map((g, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: "9.5pt", color: accent, minWidth: 160, flexShrink: 0 }}>{g.category}</span>
                  <span style={{ fontSize: "9.5pt", color: "rgba(255,255,255,0.85)" }}>{g.skills}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {hasRefs(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              References
            </h2>
            <ReferencesBlock data={data} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Professional template (navy sidebar + gold) ─────────── */

function ProfessionalPreview({ data }: { data: CvData }) {
  const navy = "#1B2838";
  const gold = "#D4A017";
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", display: "flex", minHeight: 900 }}>
      {/* Sidebar */}
      <div style={{ width: "35%", background: navy, color: "#fff", padding: "24px 18px", flexShrink: 0 }}>
        <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
          <PhotoCircle photo={data.photo} zoom={data.photoZoom} offsetX={data.photoOffsetX} offsetY={data.photoOffsetY} size={100} border={`3px solid ${gold}`} placeholderBg="#2a4060" placeholderIcon="#5a7a9a" />
        </div>

        <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, marginBottom: 12 }}>
          Contact
        </h2>
        <SidebarContact data={data} />

        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "20px 0 12px" }}>
              Skills
            </h2>
            {data.skillGroups.filter((g) => g.category && g.skills).map((g, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "8.5pt", fontWeight: 700, color: gold, marginBottom: 2 }}>{g.category}</div>
                <div style={{ fontSize: "8.5pt", color: "rgba(255,255,255,0.8)" }}>{g.skills}</div>
              </div>
            ))}
          </>
        )}

        {hasRefs(data) && (
          <>
            <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "20px 0 12px" }}>
              References
            </h2>
            {data.referencesUponRequest ? (
              <p style={{ fontSize: "8.5pt", fontStyle: "italic", color: "rgba(255,255,255,0.7)" }}>Upon request.</p>
            ) : (
              data.referees.filter((r) => r.name).map((ref, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: "8.5pt", fontWeight: 700 }}>{ref.name}</div>
                  <div style={{ fontSize: "8pt", color: "rgba(255,255,255,0.7)" }}>{ref.title}{ref.title && ref.company && ", "}{ref.company}</div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, textAlign: "justify" as const }}>
        <h1 style={{ fontSize: "22pt", fontWeight: 700, color: navy, marginBottom: 2 }}>
          {data.fullName || "Your Name"}
        </h1>
        {data.tagline && (
          <div style={{ fontSize: "10pt", color: gold, marginBottom: 16 }}>{data.tagline}</div>
        )}

        {data.summary && (
          <>
            <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "0 0 10px" }}>About Me</h2>
            <p style={{ fontSize: "9.5pt", lineHeight: 1.6, color: "#333" }}>{data.summary}</p>
          </>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <>
            <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "16px 0 10px" }}>Experience</h2>
            <ExperienceEntries data={data} />
          </>
        )}

        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "16px 0 10px" }}>Education</h2>
            <EducationEntries data={data} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Creative template (beige sidebar + black headings) ──── */

function CreativePreview({ data }: { data: CvData }) {
  const beige = "#F5F0E8";
  const dark = "#1a1a1a";
  const accent = "#C8A84E";
  return (
    <div style={{ fontFamily: "Georgia, serif", display: "flex", minHeight: 900 }}>
      {/* Sidebar */}
      <div style={{ width: "38%", background: beige, padding: "24px 18px", flexShrink: 0 }}>
        <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
          <PhotoCircle photo={data.photo} zoom={data.photoZoom} offsetX={data.photoOffsetX} offsetY={data.photoOffsetY} size={110} border={`4px solid ${dark}`} placeholderBg="#ddd5c5" placeholderIcon="#b0a890" />
        </div>

        <div style={{ background: dark, color: "#fff", padding: "6px 12px", marginBottom: 14, fontWeight: 700, fontSize: "10pt", textTransform: "uppercase", letterSpacing: "1px" }}>
          About Me
        </div>
        {data.summary && (
          <p style={{ fontSize: "8.5pt", lineHeight: 1.6, color: "#444", marginBottom: 16 }}>{data.summary}</p>
        )}

        <div style={{ background: dark, color: "#fff", padding: "6px 12px", marginBottom: 14, fontWeight: 700, fontSize: "10pt", textTransform: "uppercase", letterSpacing: "1px" }}>
          Contact
        </div>
        <SidebarContact data={data} color="#333" muted="#888" />

        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <div style={{ background: dark, color: "#fff", padding: "6px 12px", marginBottom: 14, marginTop: 16, fontWeight: 700, fontSize: "10pt", textTransform: "uppercase", letterSpacing: "1px" }}>
              Skills
            </div>
            {data.skillGroups.filter((g) => g.category && g.skills).map((g, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: "8.5pt", fontWeight: 700, color: dark, marginBottom: 1 }}>{g.category}</div>
                <div style={{ fontSize: "8.5pt", color: "#555" }}>{g.skills}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, background: "#fff", textAlign: "justify" as const }}>
        <h1 style={{ fontSize: "22pt", fontWeight: 700, color: dark, marginBottom: 2 }}>
          {data.fullName || "Your Name"}
        </h1>
        {data.tagline && (
          <div style={{ fontSize: "10pt", color: accent, marginBottom: 18, fontStyle: "italic" }}>{data.tagline}</div>
        )}

        {data.experience.some((e) => e.company || e.role) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "0 0 10px" }}>Experience</h2>
            <ExperienceEntries data={data} />
          </>
        )}

        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>Education</h2>
            <EducationEntries data={data} />
          </>
        )}

        {hasRefs(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>References</h2>
            <ReferencesBlock data={data} />
          </>
        )}
      </div>
    </div>
  );
}

/* ── Corporate template (navy header + sidebar) ──────────── */

function CorporatePreview({ data }: { data: CvData }) {
  const navy = "#1B3A5C";
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", minHeight: 900 }}>
      {/* Header */}
      <div style={{ background: navy, color: "#fff", padding: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <PhotoCircle photo={data.photo} zoom={data.photoZoom} offsetX={data.photoOffsetX} offsetY={data.photoOffsetY} size={80} border="3px solid rgba(255,255,255,0.3)" placeholderBg="rgba(255,255,255,0.15)" placeholderIcon="rgba(255,255,255,0.4)" />
        <div>
          <h1 style={{ fontSize: "22pt", fontWeight: 700, color: "#fff", marginBottom: 2, textTransform: "uppercase", letterSpacing: "1px" }}>
            {data.fullName || "Your Name"}
          </h1>
          {data.tagline && (
            <div style={{ fontSize: "9pt", color: "rgba(255,255,255,0.7)", letterSpacing: "1.5px", textTransform: "uppercase" }}>{data.tagline}</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: "32%", background: "#EDF1F5", padding: "24px 18px", flexShrink: 0 }}>
          <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, marginBottom: 10 }}>
            Contact
          </h2>
          <SidebarContact data={data} color="#333" muted={navy} />

          {data.skillGroups.some((g) => g.category && g.skills) && (
            <>
              <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, margin: "18px 0 10px" }}>
                Skills
              </h2>
              {data.skillGroups.filter((g) => g.category && g.skills).map((g, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: "8.5pt", fontWeight: 700, color: navy, marginBottom: 1 }}>{g.category}</div>
                  <div style={{ fontSize: "8.5pt", color: "#555" }}>{g.skills}</div>
                </div>
              ))}
            </>
          )}

          {hasRefs(data) && (
            <>
              <h2 style={{ fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, margin: "18px 0 10px" }}>
                References
              </h2>
              {data.referencesUponRequest ? (
                <p style={{ fontSize: "8.5pt", fontStyle: "italic", color: "#777" }}>Upon request.</p>
              ) : (
                data.referees.filter((r) => r.name).map((ref, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "#333" }}>{ref.name}</div>
                    <div style={{ fontSize: "8pt", color: "#777" }}>{ref.title}{ref.title && ref.company && ", "}{ref.company}</div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: 24, textAlign: "justify" as const }}>
          {data.summary && (
            <>
              <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, margin: "0 0 10px" }}>Profile</h2>
              <p style={{ fontSize: "9.5pt", lineHeight: 1.6, color: "#333" }}>{data.summary}</p>
            </>
          )}

          {data.experience.some((e) => e.company || e.role) && (
            <>
              <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, margin: "16px 0 10px" }}>Experience</h2>
              <ExperienceEntries data={data} />
            </>
          )}

          {data.education.some((e) => e.institution || e.degree) && (
            <>
              <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 3, margin: "16px 0 10px" }}>Education</h2>
              <EducationEntries data={data} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
