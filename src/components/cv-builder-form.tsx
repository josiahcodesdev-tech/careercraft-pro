"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { takeTransformedCv } from "@/lib/transient-cv-data";
import { PaymentModal } from "@/components/payment-modal";
import { JdTailor, type JdDraft } from "@/components/jd-tailor";
import { AssistedTextarea } from "@/components/assisted-textarea";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePaymentsEnabled } from "@/lib/use-payments-enabled";
import { CONTENT_ASPECT, mountForPrint, pdfOptions } from "@/lib/page-geometry";
import { clearTemplatePagePadding } from "@/lib/cv-print-geometry";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderKanban,
  Users,
  Award,
  LayoutTemplate,
  Upload,
  ZoomIn,
  ZoomOut,
  X,
  Move,
  Sparkles,
  Loader2,
  Download,
  Eye,
  ArrowLeft,
  FileUp,
} from "lucide-react";

export type Template = "classic" | "modern" | "executive" | "minimal" | "bold" | "professional" | "creative" | "corporate" | "florence";

const TEMPLATES: { id: Template; name: string; description: string; accent: string; font: string; hasPhoto?: boolean }[] = [
  {
    id: "corporate",
    name: "Corporate",
    description: "Single column with terracotta section rules and navy headings. Consultancy-grade and ATS-safe.",
    accent: "#C0392B",
    font: "Segoe UI",
  },
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
    id: "florence",
    name: "Florence",
    description: "Centered navy banner with keyword bar and blue section headings. Formal and corporate.",
    accent: "#1B3A5C",
    font: "Calibri",
  },
];

export interface WorkEntry {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
}

export interface SkillGroup {
  category: string;
  skills: string;
}

export interface RefereeEntry {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

export interface ProjectEntry {
  name: string;
  link: string;
  technologies: string;
  bullets: string[];
}

export interface CvData {
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
  certifications: CertificationEntry[];
  skillGroups: SkillGroup[];
  projects: ProjectEntry[];
  referees: RefereeEntry[];
  referencesUponRequest: boolean;
  // Optional closing line — citizenship, work authorisation, languages.
  footerNote: string;
}

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Summary", icon: FileText },
  { label: "Experience", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Certifications", icon: Award },
  { label: "Skills", icon: Wrench },
  { label: "Projects", icon: FolderKanban },
  { label: "References", icon: Users },
];

const emptyWork: WorkEntry = {
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
};

const emptyEducation: EducationEntry = {
  institution: "",
  degree: "",
  field: "",
  location: "",
  startDate: "",
  endDate: "",
};

const emptyCertification: CertificationEntry = { name: "", issuer: "", date: "" };

const emptySkillGroup: SkillGroup = { category: "", skills: "" };

const emptyProject: ProjectEntry = { name: "", link: "", technologies: "", bullets: [""] };

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
  certifications: [{ ...emptyCertification }],
  skillGroups: [{ ...emptySkillGroup }],
  projects: [{ ...emptyProject, bullets: [""] }],
  referees: [{ ...emptyReferee }],
  referencesUponRequest: false,
  footerNote: "",
};

const AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23D1D5DB'/%3E%3Ccircle cx='50' cy='37' r='18' fill='%239CA3AF'/%3E%3Cellipse cx='50' cy='84' rx='31' ry='22' fill='%239CA3AF'/%3E%3C/svg%3E";

const DUMMY_DATA: CvData = {
  fullName: "Jane Doe",
  tagline: "Marketing Manager | Brand Strategy | Digital Growth",
  email: "jane.doe@email.com",
  phone: "+254 700 000 000",
  location: "Nairobi, Kenya",
  linkedin: "linkedin.com/in/jane-doe",
  photo: AVATAR_PLACEHOLDER,
  photoZoom: 1,
  photoOffsetX: 0,
  photoOffsetY: 0,
  summary: "Results-driven marketing professional with 6 years of experience leading brand strategy, digital campaigns, and cross-functional teams across East African markets. Proven track record of increasing brand awareness by 40% and delivering measurable ROI. Skilled in data analytics, stakeholder engagement, and go-to-market execution.",
  experience: [
    {
      role: "Senior Marketing Manager",
      company: "Acme Corporation",
      location: "Nairobi, Kenya",
      startDate: "2022-03",
      endDate: "",
      current: true,
      bullets: [
        "Led rebranding initiative that increased brand recognition by 40% within 12 months.",
        "Managed KES 15M marketing budget, delivering 25% cost savings through strategic vendor negotiations.",
        "Built and mentored a 6-person team, improving department productivity by 30%.",
      ],
    },
    {
      role: "Marketing Specialist",
      company: "Global Solutions Ltd",
      location: "Nairobi, Kenya",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      bullets: [
        "Developed digital campaigns generating 3,500+ qualified leads per quarter.",
        "Coordinated cross-departmental product launches across 5 regional markets.",
        "Streamlined social media strategy, growing following from 10K to 45K in 18 months.",
      ],
    },
  ],
  education: [
    {
      institution: "University of Nairobi",
      degree: "Bachelor of Commerce",
      field: "Marketing",
      location: "Nairobi, Kenya",
      startDate: "2015-09",
      endDate: "2019-05",
    },
  ],
  certifications: [
    { name: "Professional Diploma in Digital Marketing", issuer: "Digital Marketing Institute", date: "2023-04" },
    { name: "Google Analytics 4 Certification", issuer: "Google Skillshop", date: "2022-08" },
  ],
  skillGroups: [
    { category: "Marketing & Strategy", skills: "Brand Management · Digital Marketing · Go-to-Market Strategy · Campaign Planning" },
    { category: "Tools & Platforms", skills: "HubSpot · Google Analytics · Salesforce · Meta Ads Manager" },
    { category: "Professional Skills", skills: "Team Leadership · Stakeholder Engagement · Data Analysis · Budget Management" },
  ],
  projects: [
    {
      name: "Brand Relaunch Campaign Microsite",
      link: "janedoe-portfolio.com/brand-relaunch",
      technologies: "Webflow · Google Analytics · Figma",
      bullets: [
        "Designed and launched a campaign microsite that drove 12,000+ unique visitors in the first month.",
        "Coordinated with design and dev teams to ship on a 3-week timeline.",
      ],
    },
  ],
  referees: [{ name: "John Smith", title: "Director of Marketing", company: "Acme Corporation", email: "j.smith@acme.com", phone: "+254 711 000 000" }],
  referencesUponRequest: false,
  footerNote: "Kenyan Citizen | Authorised to Work in Kenya | English & Swahili (Fluent)",
};

export function CvBuilderForm({ skipPayment = false }: { skipPayment?: boolean } = {}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CvData>(initial);
  const [template, setTemplate] = useState<Template>("corporate");
  const [showTemplates, setShowTemplates] = useState(false);
  const [enhancingSummary, setEnhancingSummary] = useState(false);
  const [enhancingBullets, setEnhancingBullets] = useState<number | null>(null);
  const [aiError, setAiError] = useState("");
  // The pasted job description, used to tailor AI enhance + inline suggestions.
  const [jdContext, setJdContext] = useState("");
  const [tailorOpen, setTailorOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<"pdf" | "word" | null>(null);
  // Site-wide switch the admin flips from the dashboard. Null while loading,
  // which counts as "charging" — see freeDownloads below.
  const paymentsEnabled = usePaymentsEnabled();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [showMobileDownloadMenu, setShowMobileDownloadMenu] = useState(false);
  const [generatingFile, setGeneratingFile] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Detect bfcache restoration (browser Back button) and force a clean reload
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.href = window.location.pathname;
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Load an AI-parsed CV into the form — used both by the /cv-transform hand-off
  // and by a CV uploaded straight into the tailor panel.
  const applyParsedCv = useCallback((parsed: Record<string, unknown>) => {
    const experience = Array.isArray(parsed.experience) && parsed.experience.length > 0
      ? parsed.experience.map((exp: Record<string, unknown>) => ({
          company: String(exp.company || ""),
          role: String(exp.role || ""),
          location: String(exp.location || ""),
          startDate: String(exp.startDate || ""),
          endDate: String(exp.endDate || ""),
          current: exp.current === true || /present/i.test(String(exp.endDate || "")),
          bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
            ? exp.bullets.map(String)
            : [""],
        }))
      : [{ ...emptyWork, bullets: [""] }];

    const education = Array.isArray(parsed.education) && parsed.education.length > 0
      ? parsed.education.map((edu: Record<string, unknown>) => ({
          institution: String(edu.institution || ""),
          degree: String(edu.degree || ""),
          field: String(edu.field || ""),
          location: String(edu.location || ""),
          startDate: String(edu.startDate || ""),
          endDate: String(edu.endDate || ""),
        }))
      : [{ ...emptyEducation }];

    const certifications = Array.isArray(parsed.certifications) && parsed.certifications.length > 0
      ? parsed.certifications.map((c: Record<string, unknown>) => ({
          name: String(c.name || ""),
          issuer: String(c.issuer || ""),
          date: String(c.date || ""),
        }))
      : [{ ...emptyCertification }];

    const skillGroups = Array.isArray(parsed.skillGroups) && parsed.skillGroups.length > 0
      ? parsed.skillGroups.map((g: Record<string, unknown>) => ({
          category: String(g.category || ""),
          skills: String(g.skills || ""),
        }))
      : [{ category: "", skills: "" }];

    setData((prev) => ({
      ...prev,
      fullName: String(parsed.fullName || ""),
      tagline: String(parsed.tagline || ""),
      email: String(parsed.email || ""),
      phone: String(parsed.phone || ""),
      location: String(parsed.location || ""),
      linkedin: String(parsed.linkedin || ""),
      photo: "",
      photoZoom: 1,
      photoOffsetX: 0,
      photoOffsetY: 0,
      summary: String(parsed.summary || ""),
      experience,
      education,
      certifications,
      skillGroups,
      referees: prev.referees,
      referencesUponRequest: prev.referencesUponRequest,
      footerNote: String(parsed.footerNote || ""),
    }));
  }, []);

  useEffect(() => {
    if (searchParams.get("transform") === "1") {
      try {
        const parsed = takeTransformedCv() as Record<string, unknown> | null;
        if (parsed) {
          applyParsedCv(parsed);

          // Strip ?transform=1 from the CURRENT path so a refresh loads a clean
          // form — must stay on this route (public /cv-builder or the admin
          // /admin/cv-writing/new), not hop to /cv-builder, which would unmount
          // the admin builder and lose the data just loaded into state.
          router.replace(pathname);
        }
      } catch (err) {
        console.error("Failed to load transform data:", err);
      }
    }
  }, [searchParams, router, pathname, applyParsedCv]);

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

  function updateCertification(index: number, patch: Partial<CertificationEntry>) {
    const next = (data.certifications ?? []).map((c, i) =>
      i === index ? { ...c, ...patch } : c
    );
    update("certifications", next);
  }

  function updateSkillGroup(index: number, patch: Partial<SkillGroup>) {
    const next = data.skillGroups.map((g, i) =>
      i === index ? { ...g, ...patch } : g
    );
    update("skillGroups", next);
  }

  // Pre-fill headline, summary and a key-skills group from a job description.
  // Experience/education are left untouched — the candidate adds those.
  function applyJdDraft(draft: JdDraft, jd: string) {
    setJdContext(jd);
    setData((prev) => {
      const existing = prev.skillGroups.filter((g) => g.category || g.skills);
      const skillGroups = draft.skills.length
        ? [{ category: "Key skills", skills: draft.skills.join(", ") }, ...existing]
        : prev.skillGroups;
      return {
        ...prev,
        tagline: draft.role || prev.tagline,
        summary: draft.summary || prev.summary,
        skillGroups,
      };
    });
  }

  // A CV uploaded into the tailor panel comes back fully rewritten against the
  // job description, so it replaces the form contents outright.
  function applyTailoredCv(parsed: Record<string, unknown>, jd: string) {
    setJdContext(jd);
    applyParsedCv(parsed);
    setStep(0);
  }

  function updateProject(index: number, patch: Partial<ProjectEntry>) {
    const next = data.projects.map((p, i) =>
      i === index ? { ...p, ...patch } : p
    );
    update("projects", next);
  }

  function updateProjectBullet(projIndex: number, bulletIndex: number, value: string) {
    const next = data.projects.map((p, i) => {
      if (i !== projIndex) return p;
      const bullets = p.bullets.map((b, j) => (j === bulletIndex ? value : b));
      return { ...p, bullets };
    });
    update("projects", next);
  }

  function addProjectBullet(projIndex: number) {
    const next = data.projects.map((p, i) =>
      i === projIndex ? { ...p, bullets: [...p.bullets, ""] } : p
    );
    update("projects", next);
  }

  function removeProjectBullet(projIndex: number, bulletIndex: number) {
    const next = data.projects.map((p, i) =>
      i === projIndex ? { ...p, bullets: p.bullets.filter((_, j) => j !== bulletIndex) } : p
    );
    update("projects", next);
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

  async function handleEnhanceSummary() {
    if (!data.summary.trim()) return;
    setAiError("");
    setEnhancingSummary(true);
    try {
      const res = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "summary", summary: data.summary, targetRole: data.tagline, jd: jdContext || undefined }),
      });
      const json = await res.json() as { result?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.result) update("summary", json.result);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI enhance failed.");
    } finally {
      setEnhancingSummary(false);
    }
  }

  async function handleEnhanceBullets(expIndex: number) {
    const exp = data.experience[expIndex];
    if (!exp.bullets.some((b) => b.trim())) return;
    setAiError("");
    setEnhancingBullets(expIndex);
    try {
      const res = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bullets", role: exp.role, company: exp.company, bullets: exp.bullets, jd: jdContext || undefined }),
      });
      const json = await res.json() as { result?: string[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (Array.isArray(json.result) && json.result.length > 0) {
        updateExperience(expIndex, { bullets: json.result });
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI enhance failed.");
    } finally {
      setEnhancingBullets(null);
    }
  }

  async function handlePrint() {
    const el = previewRef.current;
    if (!el) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const html2pdf = ((await import("html2pdf.js")) as any).default;
    const fileName = data.fullName ? `${data.fullName.replace(/\s+/g, "_")}_CV` : "CV";

    const printSource = el.cloneNode(true) as HTMLElement;
    clearTemplatePagePadding(printSource, template);
    groupSectionsForPrint(printSource);
    const measurementHost = mountForPrint(printSource, el.getBoundingClientRect().width);
    try {
      await document.fonts.ready;
      markMeasuredPageBreaks(printSource);
      await html2pdf()
        .set(pdfOptions(fileName, { pagebreak: { mode: ["css", "legacy"], before: ".cv-page-break" } }))
        .from(printSource)
        .save();
    } finally {
      measurementHost.remove();
    }
  }

  async function handleDownloadDocx() {
    const { downloadCvDocx } = await import("@/lib/cv-docx-export");
    await downloadCvDocx(data);
  }

  async function completeDownload(target: "pdf" | "word", reference?: string) {
    setGeneratingFile(true);
    try {
      if (target === "pdf") await handlePrint();
      else await handleDownloadDocx();
    } finally {
      setGeneratingFile(false);
    }
    fetch("/api/cv-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.fullName || "Candidate", template, data, reference }),
    }).catch(() => {});
  }

  // Two ways a download is free: admin "Create New" mode (the admin isn't a
  // paying customer, they're using their own tool), and a giveaway run with
  // payments switched off site-wide.
  //
  // `paymentsEnabled === false` rather than `!paymentsEnabled`, so the null
  // still-loading state falls through to charging.
  const freeDownloads = skipPayment || paymentsEnabled === false;

  function triggerDownload(target: "pdf" | "word") {
    if (freeDownloads) completeDownload(target);
    else setPayTarget(target);
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
      <div className="w-full overflow-y-auto border-r border-border bg-background lg:w-[47%]">
        <div className="p-8 lg:ml-auto lg:max-w-[680px]">
          {skipPayment && (
            <div className="mb-6 flex items-center gap-2 bg-brand-light text-brand text-xs font-semibold px-3 py-2 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" /> Admin mode — downloads are free, no payment required
            </div>
          )}
          {!skipPayment && paymentsEnabled === false && (
            <div className="mb-6 flex items-center gap-2 bg-brand-light text-brand text-xs font-semibold px-3 py-2 rounded-lg">
              <Sparkles className="w-3.5 h-3.5" /> Free for a limited time — download your CV at no charge
            </div>
          )}
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
                CV Builder
              </p>
              <h1 className="font-heading text-2xl font-black tracking-tight leading-tight mb-2">
                Build your ATS-friendly CV
              </h1>
              <p className="text-sm text-text-secondary">
                Fill in each section your CV updates live on the right.
              </p>
            </div>
            <button
              onClick={() => setMobilePreviewOpen(true)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-9 text-xs gap-1.5 flex-shrink-0 lg:hidden"
              )}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
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

          {/* Quick-start actions — the tailor panel takes the full row when it
              is open, since it accepts the CV upload itself. */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <JdTailor
              onApply={applyJdDraft}
              onImport={applyTailoredCv}
              onOpenChange={setTailorOpen}
              floating
            />
            {!tailorOpen && (
            <Link
              href="/cv-transform"
              className="group inline-flex w-full items-center gap-3 rounded-2xl border border-brand/15 bg-white px-4 py-4 text-left shadow-[0_10px_28px_rgba(20,64,47,0.10)] transition-all hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_14px_34px_rgba(20,64,47,0.16)]"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold text-white">
                <FileUp className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold leading-tight text-brand">Import my CV</span>
                <span className="mt-0.5 block text-xs leading-tight text-text-muted">Upload your current CV to get started</span>
              </span>
              <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </Link>
            )}
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
                  <label className="space-y-1.5 sm:col-span-2">
                    <span className="text-sm font-medium">
                      Closing line{" "}
                      <span className="text-text-muted font-normal">
                        (optional — printed at the foot of the CV)
                      </span>
                    </span>
                    <Input
                      value={data.footerNote ?? ""}
                      onChange={(e) => update("footerNote", e.target.value)}
                      placeholder="Kenyan Citizen | Authorised to Work in Kenya | English & Swahili (Fluent)"
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
                <AssistedTextarea
                  value={data.summary}
                  onChange={(v) => update("summary", v)}
                  kind="summary"
                  jd={jdContext || undefined}
                  role={data.tagline || undefined}
                  placeholder="Results-driven software engineer with 8+ years of experience building scalable web applications..."
                  className="min-h-[160px]"
                  editor
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-text-muted">
                    Tip: Mention your years of experience, core domain, 2–3
                    signature skills, and the type of impact you deliver.
                  </p>
                  <button
                    onClick={handleEnhanceSummary}
                    disabled={!data.summary.trim() || enhancingSummary}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-mid transition-colors disabled:opacity-40 flex-shrink-0 ml-3"
                  >
                    {enhancingSummary ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {enhancingSummary ? "Enhancing…" : "AI Enhance"}
                  </button>
                </div>
                {aiError && step === 1 && (
                  <p className="text-xs text-red-500">{aiError}</p>
                )}
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
                      <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-sm font-medium">
                          Location <span className="text-text-muted font-normal">(optional)</span>
                        </span>
                        <Input
                          value={exp.location ?? ""}
                          onChange={(e) =>
                            updateExperience(i, { location: e.target.value })
                          }
                          placeholder="Nairobi, Kenya"
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
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => addBullet(i)}
                          className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add bullet
                        </button>
                        <button
                          onClick={() => handleEnhanceBullets(i)}
                          disabled={!exp.bullets.some((b) => b.trim()) || enhancingBullets === i}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-mid transition-colors disabled:opacity-40"
                        >
                          {enhancingBullets === i ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {enhancingBullets === i ? "Enhancing…" : "AI Enhance"}
                        </button>
                      </div>
                      {aiError && step === 2 && enhancingBullets === null && (
                        <p className="text-xs text-red-500">{aiError}</p>
                      )}
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
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Location <span className="text-text-muted font-normal">(optional)</span>
                        </span>
                        <Input
                          value={edu.location ?? ""}
                          onChange={(e) =>
                            updateEducation(i, { location: e.target.value })
                          }
                          placeholder="Nairobi, Kenya"
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
                  Certifications
                </h2>
                <p className="text-sm text-text-secondary">
                  Professional certificates, short courses and licences. Leave
                  this step empty if you have none — the section is simply left
                  off your CV.
                </p>

                {(data.certifications ?? []).map((cert, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Certification {i + 1}
                      </span>
                      {(data.certifications ?? []).length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "certifications",
                              (data.certifications ?? []).filter((_, j) => j !== i)
                            )
                          }
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-medium">Certification</span>
                      <Input
                        value={cert.name}
                        onChange={(e) =>
                          updateCertification(i, { name: e.target.value })
                        }
                        placeholder="Monitoring & Evaluation for NGOs"
                      />
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Issuing body
                        </span>
                        <Input
                          value={cert.issuer}
                          onChange={(e) =>
                            updateCertification(i, { issuer: e.target.value })
                          }
                          placeholder="Vantage Africa School of Leadership"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">
                          Date awarded{" "}
                          <span className="text-text-muted font-normal">
                            (optional)
                          </span>
                        </span>
                        <Input
                          type="month"
                          value={cert.date}
                          onChange={(e) =>
                            updateCertification(i, { date: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("certifications", [
                      ...(data.certifications ?? []),
                      { ...emptyCertification },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add another certification
                </button>
              </div>
            )}

            {step === 5 && (
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

            {step === 6 && (
              <div className="space-y-5">
                <h2 className="font-heading text-lg font-extrabold tracking-tight">
                  Projects
                </h2>
                <p className="text-sm text-text-secondary">
                  Optional — add personal or professional projects if you have
                  relevant work to showcase.
                </p>

                {data.projects.map((proj, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-text-secondary">
                        Project {i + 1}
                      </span>
                      {data.projects.length > 1 && (
                        <button
                          onClick={() =>
                            update(
                              "projects",
                              data.projects.filter((_, j) => j !== i)
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
                        <span className="text-sm font-medium">Project name</span>
                        <Input
                          value={proj.name}
                          onChange={(e) =>
                            updateProject(i, { name: e.target.value })
                          }
                          placeholder="Inventory Tracker App"
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-sm font-medium">Link (optional)</span>
                        <Input
                          value={proj.link}
                          onChange={(e) =>
                            updateProject(i, { link: e.target.value })
                          }
                          placeholder="github.com/you/project or live URL"
                        />
                      </label>
                    </div>
                    <label className="space-y-1.5 block">
                      <span className="text-sm font-medium">Technologies used (optional)</span>
                      <Input
                        value={proj.technologies}
                        onChange={(e) =>
                          updateProject(i, { technologies: e.target.value })
                        }
                        placeholder="React · Node.js · PostgreSQL"
                      />
                    </label>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">
                        Key details / achievements
                      </span>
                      {proj.bullets.map((bullet, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="mt-2 text-text-muted text-sm">
                            •
                          </span>
                          <Input
                            value={bullet}
                            onChange={(e) => updateProjectBullet(i, j, e.target.value)}
                            placeholder="Built a REST API handling 10K+ requests/day"
                            className="flex-1"
                          />
                          {proj.bullets.length > 1 && (
                            <button
                              onClick={() => removeProjectBullet(i, j)}
                              className="text-red-400 hover:text-red-600 transition-colors mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addProjectBullet(i)}
                        className="text-sm text-brand font-medium flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    update("projects", [
                      ...data.projects,
                      { ...emptyProject, bullets: [""] },
                    ])
                  }
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full gap-2"
                  )}
                >
                  <Plus className="w-4 h-4" /> Add project
                </button>
              </div>
            )}

            {step === 7 && (
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerDownload("word")}
                  className={cn(buttonVariants({ variant: "outline" }), "gap-2 border-brand text-brand hover:bg-brand/5")}
                >
                  <Download className="w-4 h-4" /> Download Word
                </button>
                <button
                  onClick={() => {
                    setMobilePreviewOpen(true);
                    triggerDownload("pdf");
                  }}
                  className={cn(buttonVariants(), "bg-brand hover:bg-brand-mid text-white gap-2")}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment modal */}
      {payTarget && (
        <PaymentModal
          service="CV Builder Download"
          product="cv"
          onSuccess={async (reference) => {
            const target = payTarget;
            setPayTarget(null);
            if (target) await completeDownload(target, reference);
          }}
          onClose={() => setPayTarget(null)}
        />
      )}

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
                    {t.id === "corporate" && template !== t.id && (
                      <div className="absolute top-1.5 right-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Recommended
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
      <div
        className={cn(
          "flex-col bg-[#f0efe9] overflow-hidden",
          mobilePreviewOpen
            ? "fixed inset-0 z-40 flex bg-white lg:static lg:z-auto lg:w-[53%] lg:bg-[#f0efe9]"
            : "hidden lg:flex lg:w-[53%]"
        )}
      >
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobilePreviewOpen(false)}
              className="lg:hidden -ml-2 p-1.5 rounded-lg hover:bg-background text-text-secondary"
              aria-label="Back to form"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-text-secondary">
              Live Preview
            </span>
          </div>
          {/* Desktop: full button row */}
          <div className="hidden lg:flex items-center gap-2">
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
              onClick={() => triggerDownload("word")}
              disabled={!hasContent}
              className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs gap-1.5 disabled:opacity-40 border-brand text-brand hover:bg-brand/5")}
            >
              <Download className="w-3.5 h-3.5" /> Word
            </button>
            <button
              onClick={() => triggerDownload("pdf")}
              disabled={!hasContent}
              className={cn(buttonVariants({ variant: "outline" }), "h-8 text-xs gap-1.5 disabled:opacity-40")}
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>

          {/* Mobile: icon-only template + single Download button with a menu */}
          <div className="flex lg:hidden items-center gap-2 relative">
            <button
              onClick={() => setShowTemplates(true)}
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-8 p-0")}
              aria-label="Choose template"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowMobileDownloadMenu((v) => !v)}
              disabled={!hasContent}
              className={cn(buttonVariants(), "h-8 text-xs gap-1.5 bg-brand hover:bg-brand-mid text-white disabled:opacity-40")}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            {showMobileDownloadMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMobileDownloadMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-40 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMobileDownloadMenu(false);
                      triggerDownload("pdf");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-background transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileDownloadMenu(false);
                      triggerDownload("word");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-background transition-colors text-left border-t border-border"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Word
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 2xl:p-0">
          <div
            ref={previewRef}
            className="mx-auto min-h-[900px] max-w-[680px] overflow-hidden rounded-lg bg-white shadow-md 2xl:mx-0 2xl:min-h-[1160px] 2xl:max-w-[820px] 2xl:rounded-none"
          >
            {(() => {
              const previewData = hasContent ? data : DUMMY_DATA;
              return (
                <div className="relative">
                  {!hasContent && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap pointer-events-none">
                      Sample preview · fill the form to see your CV
                    </div>
                  )}
                  {template === "classic" && <ClassicPreview data={previewData} />}
                  {template === "modern" && <ModernPreview data={previewData} />}
                  {template === "executive" && <ExecutivePreview data={previewData} />}
                  {template === "minimal" && <MinimalPreview data={previewData} />}
                  {template === "bold" && <BoldPreview data={previewData} />}
                  {template === "professional" && <ProfessionalPreview data={previewData} />}
                  {template === "creative" && <CreativePreview data={previewData} />}
                  {template === "corporate" && <CorporatePreview data={previewData} />}
                  {template === "florence" && <FlorencePreview data={previewData} />}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {generatingFile && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-foreground text-background rounded-xl shadow-xl px-4 py-3 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating your file…
        </div>
      )}
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
          <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
                pageBreakAfter: "avoid",
                breakAfter: "avoid",
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
                {exp.location && (
                  <span style={{ fontSize: "9pt", color: "#777" }}>
                    {" "}· {exp.location}
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
              <div style={{ marginTop: 4 }}>
                {exp.bullets
                  .filter((b) => b.trim())
                  .map((b, j) => (
                    <div
                      key={j}
                      style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "flex-start" }}
                    >
                      <span style={{ flexShrink: 0, fontSize: "9.5pt", lineHeight: 1.5, color: "#333" }}>•</span>
                      <span style={{ fontSize: "9.5pt", lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
              </div>
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
          <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid" }}>
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
                {edu.location && (
                  <span style={{ fontSize: "9pt", color: "#777" }}>
                    {" "}· {edu.location}
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

function ProjectEntries({ data }: { data: CvData }) {
  return (
    <>
      {(data.projects ?? [])
        .filter((p) => p.name)
        .map((proj, i) => (
          <div key={i} style={{ marginBottom: 12, pageBreakInside: "avoid", breakInside: "avoid" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
                pageBreakAfter: "avoid",
                breakAfter: "avoid",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "10pt" }}>{proj.name}</span>
              {proj.link && (
                <span style={{ fontSize: "8.5pt", color: "#777", whiteSpace: "nowrap" }}>
                  {proj.link}
                </span>
              )}
            </div>
            {proj.technologies && (
              <div style={{ fontSize: "9pt", color: "#555", fontStyle: "italic", marginBottom: 3 }}>
                {proj.technologies}
              </div>
            )}
            {proj.bullets.some((b) => b.trim()) && (
              <div style={{ marginTop: 4 }}>
                {proj.bullets
                  .filter((b) => b.trim())
                  .map((b, j) => (
                    <div
                      key={j}
                      style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "flex-start" }}
                    >
                      <span style={{ flexShrink: 0, fontSize: "9.5pt", lineHeight: 1.5, color: "#333" }}>•</span>
                      <span style={{ fontSize: "9.5pt", lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
    </>
  );
}

function hasProjects(data: CvData) {
  return (data.projects ?? []).some((p) => p.name.trim());
}

function CertificationEntries({ data }: { data: CvData }) {
  return (
    <>
      {(data.certifications ?? [])
        .filter((c) => c.name)
        .map((cert, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 5,
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div style={{ fontSize: "9.5pt" }}>
              <span style={{ fontWeight: 700 }}>{cert.name}</span>
              {cert.issuer && (
                <span style={{ color: "#555" }}> — {cert.issuer}</span>
              )}
            </div>
            {cert.date && (
              <span
                style={{
                  fontSize: "8.5pt",
                  color: "#777",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {formatDate(cert.date)}
              </span>
            )}
          </div>
        ))}
    </>
  );
}

function hasCertifications(data: CvData) {
  return (data.certifications ?? []).some((c) => c.name.trim());
}

// The closing line (citizenship, work authorisation, languages) sits at the
// foot of whichever template is in use, separated by a hairline rule.
function FooterNote({
  data,
  color = "#777",
  rule = "#ddd",
}: {
  data: CvData;
  color?: string;
  rule?: string;
}) {
  if (!data.footerNote?.trim()) return null;
  return (
    <div
      style={{
        marginTop: 20,
        paddingTop: 10,
        borderTop: `1px solid ${rule}`,
        textAlign: "center" as const,
        fontSize: "8.5pt",
        fontStyle: "italic",
        color,
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {data.footerNote}
    </div>
  );
}

/* ── Classic template ────────────────────────────────────── */

// Wrap each CV section (an <h2> heading plus the sibling content following it,
// up to the next heading) in a break-inside:avoid box so html2pdf keeps the
// whole section on one page — pushing an unfittable section to the next page
// rather than slicing through it, which previously left a section straddling
// the page edge with no room for the footer. Runs on a throwaway clone so the
// on-screen preview is untouched. Experience is skipped: it can legitimately
// run past one page and shouldn't be forced whole onto the next.
function groupSectionsForPrint(root: HTMLElement) {
  const headings = Array.from(root.querySelectorAll("h2"));
  for (const heading of headings) {
    const parent = heading.parentElement;
    if (!parent) continue;
    const firstContent = heading.nextElementSibling;
    const group = document.createElement("div");
    group.style.breakInside = "avoid";
    group.style.pageBreakInside = "avoid";
    parent.insertBefore(group, heading);
    group.appendChild(heading);
    if (firstContent && firstContent.tagName !== "H2") group.appendChild(firstContent);
  }
}



function markMeasuredPageBreaks(root: HTMLElement) {
  const rootRect = root.getBoundingClientRect();
  // Content is scaled to the 174 mm printable width, so a page is that box's
  // aspect ratio tall — not the full sheet's 297/210.
  const pageHeight = rootRect.width * CONTENT_ASPECT;
  if (!pageHeight) return;

  const candidates = Array.from(root.querySelectorAll<HTMLElement>(
    "h2, [style*='page-break-inside'], [style*='break-inside']"
  )).filter((element) => !element.parentElement?.closest("[style*='break-inside']"));

  let insertedSpace = 0;
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    const top = rect.top - rootRect.top + insertedSpace;
    const bottom = rect.bottom - rootRect.top + insertedSpace;
    const startsOn = Math.floor(top / pageHeight);
    const endsOn = Math.floor(Math.max(top, bottom - 1) / pageHeight);
    if (startsOn === endsOn || rect.height >= pageHeight * 0.85) continue;
    insertedSpace += (startsOn + 1) * pageHeight - top;
    element.classList.add("cv-page-break");
    element.style.breakBefore = "page";
    element.style.pageBreakBefore = "always";
  }
}

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
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

export function ClassicPreview({ data }: { data: CvData }) {
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

      {hasCertifications(data) && (
        <>
          <ClassicSectionHeading>Certifications</ClassicSectionHeading>
          <CertificationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ClassicSectionHeading>Core Skills</ClassicSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasProjects(data) && (
        <>
          <ClassicSectionHeading>Projects</ClassicSectionHeading>
          <ProjectEntries data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ClassicSectionHeading>References</ClassicSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
      <FooterNote data={data} />
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
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

export function ModernPreview({ data }: { data: CvData }) {
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

        {hasCertifications(data) && (
          <>
            <ModernSectionHeading>Certifications</ModernSectionHeading>
            <CertificationEntries data={data} />
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

        {hasProjects(data) && (
          <>
            <ModernSectionHeading>Projects</ModernSectionHeading>
            <ProjectEntries data={data} />
          </>
        )}

        {hasRefs(data) && (
          <>
            <ModernSectionHeading>References</ModernSectionHeading>
            <ReferencesBlock data={data} />
          </>
        )}
        <FooterNote data={data} />
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
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

export function ExecutivePreview({ data }: { data: CvData }) {
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

      {hasCertifications(data) && (
        <>
          <ExecSectionHeading>Certifications</ExecSectionHeading>
          <CertificationEntries data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <ExecSectionHeading>Core Skills</ExecSectionHeading>
          <SkillRows data={data} />
        </>
      )}

      {hasProjects(data) && (
        <>
          <ExecSectionHeading>Projects</ExecSectionHeading>
          <ProjectEntries data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <ExecSectionHeading>References</ExecSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
      <FooterNote data={data} />
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
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

export function MinimalPreview({ data }: { data: CvData }) {
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

      {hasCertifications(data) && (
        <>
          <MinimalSectionHeading>Certifications</MinimalSectionHeading>
          <CertificationEntries data={data} />
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

      {hasProjects(data) && (
        <>
          <MinimalSectionHeading>Projects</MinimalSectionHeading>
          <ProjectEntries data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <MinimalSectionHeading>References</MinimalSectionHeading>
          <ReferencesBlock data={data} />
        </>
      )}
      <FooterNote data={data} />
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
    const navy = "#1F3A5F";
    return (
      <div style={{ height: "100%", padding: "12px 14px", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 7, width: "75%", background: navy, borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 3, width: "60%", background: "#ccc", borderRadius: 2 }} />
          </div>
          <div style={{ width: "32%", flexShrink: 0 }}>
            {[100, 85, 92].map((w, i) => (
              <div key={i} style={{ height: 2, width: `${w}%`, background: "#ddd", borderRadius: 2, marginBottom: 2 }} />
            ))}
          </div>
        </div>
        <div style={{ height: 1.5, width: "100%", background: accent, margin: "6px 0 7px" }} />
        <div style={{ height: 3, width: "28%", background: accent, borderRadius: 2, marginBottom: 2 }} />
        <div style={{ height: 1, width: "100%", background: "#e8e8e8", marginBottom: 5 }} />
        {lineW.map((w, i) => (
          <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
        ))}
        <div style={{ height: 3, width: "22%", background: accent, borderRadius: 2, marginTop: 5, marginBottom: 2 }} />
        <div style={{ height: 1, width: "100%", background: "#e8e8e8", marginBottom: 5 }} />
        <div style={{ height: 3, width: "45%", background: navy, borderRadius: 2, marginBottom: 3 }} />
        {lineW.slice(0, 2).map((w, i) => (
          <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
        ))}
      </div>
    );
  }

  if (id === "florence") {
    return (
      <div style={{ height: "100%", background: "#fff" }}>
        <div style={{ background: accent, padding: "8px 16px", textAlign: "center" as const }}>
          <div style={{ height: 7, width: "55%", background: "rgba(255,255,255,0.9)", borderRadius: 2, margin: "0 auto" }} />
        </div>
        <div style={{ background: "#EBF0F7", padding: "4px 16px" }}>
          <div style={{ height: 3, width: "90%", background: "rgba(27,58,92,0.3)", borderRadius: 2, margin: "0 auto" }} />
        </div>
        <div style={{ padding: "6px 16px" }}>
          <div style={{ height: 4, width: "40%", background: accent, borderRadius: 2, margin: "0 auto 4px", opacity: 0.7 }} />
          <div style={{ height: 1, width: "80%", background: accent, margin: "0 auto 5px", opacity: 0.4 }} />
          {lineW.map((w, i) => (
            <div key={i} style={{ height: 2.5, width: w, background: "#e5e5e5", borderRadius: 2, marginBottom: 2.5 }} />
          ))}
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

export function BoldPreview({ data }: { data: CvData }) {
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

        {hasCertifications(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              Certifications
            </h2>
            <CertificationEntries data={data} />
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

        {hasProjects(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>
              Projects
            </h2>
            <ProjectEntries data={data} />
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
        <FooterNote data={data} color="rgba(255,255,255,0.6)" rule="rgba(255,255,255,0.2)" />
      </div>
    </div>
  );
}

/* ── Professional template (navy sidebar + gold) ─────────── */

export function ProfessionalPreview({ data }: { data: CvData }) {
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

        {hasCertifications(data) && (
          <>
            <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "16px 0 10px" }}>Certifications</h2>
            <CertificationEntries data={data} />
          </>
        )}

        {hasProjects(data) && (
          <>
            <h2 style={{ fontSize: "10pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: gold, borderBottom: `2px solid ${gold}`, paddingBottom: 3, margin: "16px 0 10px" }}>Projects</h2>
            <ProjectEntries data={data} />
          </>
        )}
        <FooterNote data={data} />
      </div>
    </div>
  );
}

/* ── Creative template (beige sidebar + black headings) ──── */

export function CreativePreview({ data }: { data: CvData }) {
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

        {hasCertifications(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>Certifications</h2>
            <CertificationEntries data={data} />
          </>
        )}

        {hasProjects(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>Projects</h2>
            <ProjectEntries data={data} />
          </>
        )}

        {hasRefs(data) && (
          <>
            <h2 style={{ fontSize: "10.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: dark, borderBottom: `2px solid ${accent}`, paddingBottom: 3, margin: "16px 0 10px" }}>References</h2>
            <ReferencesBlock data={data} />
          </>
        )}
        <FooterNote data={data} />
      </div>
    </div>
  );
}

/* ── Corporate template ──────────────────────────────────── */

// Corporate is a single-column consultancy layout: a left-aligned name with the
// contact details set to its right, a terracotta rule closing the header, and
// terracotta section labels over hairline rules. It carries its own entry
// blocks rather than the shared ones — the navy title / italic employer / right
// aligned dates arrangement is what makes the whole page read as one document.
const CORP_ACCENT = "#C0392B";
const CORP_NAVY = "#1F3A5F";
const CORP_BODY = "#333333";
const CORP_MUTED = "#666666";
const CORP_RULE = "#DDDDDD";

function CorporateSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "9pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: CORP_ACCENT,
        borderBottom: `1px solid ${CORP_RULE}`,
        paddingBottom: 5,
        margin: "18px 0 10px",
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

// Navy title on the left with the date flush right, employer/institution in
// italic underneath. Shared by experience, education and projects so the three
// sections stay on the same grid.
function CorporateEntryHead({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          pageBreakAfter: "avoid",
          breakAfter: "avoid",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "10.5pt", color: CORP_NAVY }}>
          {title}
        </span>
        {meta && (
          <span
            style={{
              fontSize: "8.5pt",
              color: CORP_MUTED,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {meta}
          </span>
        )}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "9pt",
            fontStyle: "italic",
            color: CORP_MUTED,
            marginTop: 1,
          }}
        >
          {subtitle}
        </div>
      )}
    </>
  );
}

function CorporateBullets({ items }: { items: string[] }) {
  const visible = items.filter((b) => b.trim());
  if (visible.length === 0) return null;
  return (
    <div style={{ marginTop: 5, paddingLeft: 10 }}>
      {visible.map((b, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}
        >
          <span
            style={{
              flexShrink: 0,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: CORP_MUTED,
              marginTop: 6,
            }}
          />
          <span style={{ fontSize: "9.5pt", lineHeight: 1.55, color: CORP_BODY }}>
            {b}
          </span>
        </div>
      ))}
    </div>
  );
}

// "Company Name, City, Country" — the employer line, with the location folded
// in only when one was given.
function joinPlace(name: string, location?: string) {
  return [name, location].filter((part) => part && part.trim()).join(", ");
}

function CorporateHeader({ data }: { data: CvData }) {
  const contact = [data.phone, data.email, data.linkedin, data.location].filter(
    Boolean,
  );
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 28,
        borderBottom: `2px solid ${CORP_ACCENT}`,
        paddingBottom: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontSize: "21pt",
            fontWeight: 700,
            color: CORP_NAVY,
            lineHeight: 1.15,
            marginBottom: data.tagline ? 5 : 0,
          }}
        >
          {data.fullName || "Your Name"}
        </h1>
        {data.tagline && (
          <div style={{ fontSize: "10pt", color: CORP_MUTED, lineHeight: 1.4 }}>
            {data.tagline}
          </div>
        )}
      </div>
      {contact.length > 0 && (
        <div
          style={{
            fontSize: "8.5pt",
            color: CORP_MUTED,
            lineHeight: 1.65,
            flexShrink: 0,
            maxWidth: "44%",
            paddingTop: 3,
          }}
        >
          {contact.map((item, i) => (
            <div key={i}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function CorporateExperience({ data }: { data: CvData }) {
  return (
    <>
      {data.experience
        .filter((e) => e.company || e.role)
        .map((exp, i) => (
          <div
            key={i}
            style={{ marginBottom: 13, pageBreakInside: "avoid", breakInside: "avoid" }}
          >
            <CorporateEntryHead
              title={exp.role}
              subtitle={joinPlace(exp.company, exp.location)}
              meta={`${formatDate(exp.startDate)} – ${
                exp.current ? "Present" : formatDate(exp.endDate)
              }`}
            />
            <CorporateBullets items={exp.bullets} />
          </div>
        ))}
    </>
  );
}

function CorporateEducation({ data }: { data: CvData }) {
  return (
    <>
      {data.education
        .filter((e) => e.institution || e.degree)
        .map((edu, i) => (
          <div
            key={i}
            style={{ marginBottom: 9, pageBreakInside: "avoid", breakInside: "avoid" }}
          >
            <CorporateEntryHead
              title={`${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`}
              subtitle={joinPlace(edu.institution, edu.location)}
              meta={
                edu.startDate
                  ? `${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}`
                  : formatDate(edu.endDate)
              }
            />
          </div>
        ))}
    </>
  );
}

// Certificate name in bold navy running straight into the issuing body, with
// the award date flush right.
function CorporateCertifications({ data }: { data: CvData }) {
  return (
    <>
      {(data.certifications ?? [])
        .filter((c) => c.name)
        .map((cert, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 16,
              marginBottom: 6,
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div style={{ fontSize: "9.5pt", lineHeight: 1.45 }}>
              <span style={{ fontWeight: 700, color: CORP_NAVY }}>{cert.name}</span>
              {cert.issuer && (
                <span style={{ color: CORP_BODY }}> {cert.issuer}</span>
              )}
            </div>
            {cert.date && (
              <span
                style={{
                  fontSize: "8.5pt",
                  color: CORP_MUTED,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {formatDate(cert.date)}
              </span>
            )}
          </div>
        ))}
    </>
  );
}

function CorporateSkills({ data }: { data: CvData }) {
  return (
    <div>
      {data.skillGroups
        .filter((g) => g.category && g.skills)
        .map((g, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 18,
              marginBottom: 7,
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: "9.5pt",
                lineHeight: 1.5,
                color: CORP_NAVY,
                width: 140,
                flexShrink: 0,
              }}
            >
              {g.category}
            </span>
            <span
              style={{
                fontSize: "9.5pt",
                lineHeight: 1.5,
                color: CORP_BODY,
                flex: 1,
                minWidth: 0,
              }}
            >
              {g.skills}
            </span>
          </div>
        ))}
    </div>
  );
}

function CorporateProjects({ data }: { data: CvData }) {
  return (
    <>
      {(data.projects ?? [])
        .filter((p) => p.name)
        .map((proj, i) => (
          <div
            key={i}
            style={{ marginBottom: 13, pageBreakInside: "avoid", breakInside: "avoid" }}
          >
            <CorporateEntryHead
              title={proj.name}
              subtitle={proj.technologies}
              meta={proj.link}
            />
            <CorporateBullets items={proj.bullets} />
          </div>
        ))}
    </>
  );
}

// Three referees side by side, divided by hairlines.
function CorporateReferences({ data }: { data: CvData }) {
  if (data.referencesUponRequest) {
    return (
      <p style={{ fontSize: "9pt", fontStyle: "italic", color: CORP_MUTED }}>
        References provided upon request.
      </p>
    );
  }
  const referees = data.referees.filter((r) => r.name);
  return (
    <div style={{ display: "flex", gap: 20 }}>
      {referees.map((ref, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            minWidth: 0,
            paddingLeft: i === 0 ? 0 : 20,
            borderLeft: i === 0 ? "none" : `1px solid ${CORP_RULE}`,
            pageBreakInside: "avoid",
            breakInside: "avoid",
          }}
        >
          <div style={{ fontSize: "9.5pt", fontWeight: 700, color: CORP_NAVY }}>
            {ref.name}
          </div>
          {ref.title && (
            <div
              style={{
                fontSize: "8.5pt",
                fontStyle: "italic",
                color: CORP_MUTED,
                lineHeight: 1.5,
              }}
            >
              {ref.title}
            </div>
          )}
          {ref.company && (
            <div style={{ fontSize: "8.5pt", color: CORP_BODY, lineHeight: 1.5 }}>
              {ref.company}
            </div>
          )}
          {ref.email && (
            <div
              style={{
                fontSize: "8.5pt",
                color: CORP_ACCENT,
                lineHeight: 1.5,
                wordBreak: "break-word" as const,
              }}
            >
              {ref.email}
            </div>
          )}
          {ref.phone && (
            <div style={{ fontSize: "8.5pt", color: CORP_MUTED, lineHeight: 1.5 }}>
              {ref.phone}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CorporatePreview({ data }: { data: CvData }) {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        // ~14mm of A4 margin once the 680px preview is scaled to page width.
        padding: "40px 44px 42px",
        color: CORP_BODY,
        minHeight: 900,
      }}
    >
      <CorporateHeader data={data} />

      {data.summary && (
        <>
          <CorporateSectionHeading>Professional Summary</CorporateSectionHeading>
          <p
            style={{
              fontSize: "9.5pt",
              lineHeight: 1.6,
              color: CORP_BODY,
              textAlign: "justify" as const,
            }}
          >
            {data.summary}
          </p>
        </>
      )}

      {data.experience.some((e) => e.company || e.role) && (
        <>
          <CorporateSectionHeading>Professional Experience</CorporateSectionHeading>
          <CorporateExperience data={data} />
        </>
      )}

      {data.education.some((e) => e.institution || e.degree) && (
        <>
          <CorporateSectionHeading>Education</CorporateSectionHeading>
          <CorporateEducation data={data} />
        </>
      )}

      {hasCertifications(data) && (
        <>
          <CorporateSectionHeading>Certifications</CorporateSectionHeading>
          <CorporateCertifications data={data} />
        </>
      )}

      {data.skillGroups.some((g) => g.category && g.skills) && (
        <>
          <CorporateSectionHeading>Core Skills</CorporateSectionHeading>
          <CorporateSkills data={data} />
        </>
      )}

      {hasProjects(data) && (
        <>
          <CorporateSectionHeading>Projects</CorporateSectionHeading>
          <CorporateProjects data={data} />
        </>
      )}

      {hasRefs(data) && (
        <>
          <CorporateSectionHeading>References</CorporateSectionHeading>
          <CorporateReferences data={data} />
        </>
      )}

      <FooterNote data={data} color={CORP_MUTED} />
    </div>
  );
}

/* ── Florence template (navy banner + keyword bar) ────────── */

function FlorenceSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "10.5pt",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "#1B3A5C",
        borderBottom: "2px solid #1B3A5C",
        paddingBottom: 3,
        margin: "16px 0 10px",
        textAlign: "center",
        pageBreakAfter: "avoid",
        breakAfter: "avoid",
      }}
    >
      {children}
    </h2>
  );
}

export function FlorencePreview({ data }: { data: CvData }) {
  const navy = "#1B3A5C";
  const allSkills = data.skillGroups.filter((g) => g.skills).map((g) => g.skills).join(" | ");

  return (
    <div style={{ fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", color: "#1a1a1a", minHeight: 900 }}>
      {/* Name banner */}
      <div style={{ background: navy, padding: "16px 28px", textAlign: "center" as const }}>
        <h1 style={{ fontSize: "22pt", fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>
          {data.fullName || "Your Name"}
        </h1>
      </div>

      {/* Tagline */}
      {data.tagline && (
        <div style={{ textAlign: "center" as const, padding: "7px 28px 4px", fontWeight: 700, fontSize: "11pt", color: "#1a1a1a" }}>
          {data.tagline}
        </div>
      )}

      {/* Keywords bar */}
      {allSkills && (
        <div style={{ background: "#EBF0F7", padding: "5px 28px", textAlign: "center" as const, fontSize: "8.5pt", color: navy, lineHeight: 1.6 }}>
          {allSkills}
        </div>
      )}

      {/* Contact row */}
      <div style={{ textAlign: "center" as const, padding: "7px 28px 10px", fontSize: "9pt", borderBottom: `1.5px solid ${navy}` }}>
        {[
          data.phone && `Tel: ${data.phone}`,
          data.email && `Email: ${data.email}`,
          data.linkedin && `LinkedIn: ${data.linkedin}`,
          data.location,
        ].filter(Boolean).map((item, i, arr) => (
          <span key={i}>
            <strong>{item}</strong>
            {i < arr.length - 1 && <span style={{ margin: "0 8px", color: "#555" }}>|</span>}
          </span>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: "4px 28px 28px", textAlign: "justify" as const }}>
        {/* Career Profile */}
        {data.summary && (
          <>
            <FlorenceSectionHeading>Career Profile</FlorenceSectionHeading>
            <p style={{ fontSize: "9.5pt", lineHeight: 1.65 }}>{data.summary}</p>
          </>
        )}

        {/* Experience */}
        {data.experience.some((e) => e.company || e.role) && (
          <>
            <FlorenceSectionHeading>Professional Experience</FlorenceSectionHeading>
            {data.experience
              .filter((e) => e.company || e.role)
              .map((exp, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: "10pt", color: navy }}>{exp.role}</span>
                    <span style={{ fontSize: "8.5pt", color: navy, whiteSpace: "nowrap" }}>
                      {formatDate(exp.startDate)}{(exp.startDate || exp.endDate || exp.current) ? " – " : ""}{exp.current ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.company && (
                    <div style={{ fontWeight: 600, fontSize: "9.5pt", color: "#333", marginBottom: 4 }}>{exp.company}</div>
                  )}
                  {exp.bullets.some((b) => b.trim()) && (
                    <div style={{ marginTop: 4 }}>
                      {exp.bullets.filter((b) => b.trim()).map((b, j) => (
                        <div key={j} style={{ display: "flex", gap: 6, marginBottom: 3, alignItems: "flex-start" }}>
                          <span style={{ flexShrink: 0, fontSize: "9.5pt", lineHeight: 1.5, color: "#333" }}>•</span>
                          <span style={{ fontSize: "9.5pt", lineHeight: 1.5 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </>
        )}

        {/* Education */}
        {data.education.some((e) => e.institution || e.degree) && (
          <>
            <FlorenceSectionHeading>Education</FlorenceSectionHeading>
            {data.education
              .filter((e) => e.institution || e.degree)
              .map((edu, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: "10pt", color: navy }}>
                      {edu.degree}{edu.field && ` in ${edu.field}`}
                    </span>
                    <span style={{ fontSize: "8.5pt", color: "#777", whiteSpace: "nowrap" }}>
                      {formatDate(edu.startDate)}{edu.endDate ? ` – ${formatDate(edu.endDate)}` : ""}
                    </span>
                  </div>
                  {edu.institution && (
                    <div style={{ fontSize: "9.5pt", color: "#333" }}>
                      {joinPlace(edu.institution, edu.location)}
                    </div>
                  )}
                </div>
              ))}
          </>
        )}

        {/* Certifications */}
        {hasCertifications(data) && (
          <>
            <FlorenceSectionHeading>Certifications</FlorenceSectionHeading>
            <CertificationEntries data={data} />
          </>
        )}

        {/* Core skills as rows (category → skills) */}
        {data.skillGroups.some((g) => g.category && g.skills) && (
          <>
            <FlorenceSectionHeading>Core Skills</FlorenceSectionHeading>
            <SkillRows data={data} />
          </>
        )}

        {/* Projects */}
        {hasProjects(data) && (
          <>
            <FlorenceSectionHeading>Projects</FlorenceSectionHeading>
            <ProjectEntries data={data} />
          </>
        )}

        {/* References */}
        {hasRefs(data) && (
          <>
            <FlorenceSectionHeading>References</FlorenceSectionHeading>
            <ReferencesBlock data={data} />
          </>
        )}
        <FooterNote data={data} />
      </div>
    </div>
  );
}
