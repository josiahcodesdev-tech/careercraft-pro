const STORAGE_KEY = "careercraft_analytics";

export interface CvEvent {
  name: string;
  template: string;
  date: string;
  id?: string;
}

export interface InterviewEvent {
  name: string;
  role: string;
  date: string;
  id?: string;
}

export interface EnquiryEvent {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
  date: string;
}

export interface ProposalEvent {
  name: string;
  date: string;
}

export interface Analytics {
  cvDownloads: CvEvent[];
  interviewPreps: InterviewEvent[];
  enquiries: EnquiryEvent[];
  proposals: ProposalEvent[];
}

const empty: Analytics = {
  cvDownloads: [],
  interviewPreps: [],
  enquiries: [],
  proposals: [],
};

export function getAnalytics(): Analytics {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch {
    return empty;
  }
}

function save(data: Analytics) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function trackCvDownload(event: Omit<CvEvent, "date" | "id">, fullData?: Record<string, unknown>) {
  const id = genId();
  const data = getAnalytics();
  data.cvDownloads.unshift({ ...event, id, date: new Date().toISOString() });
  save(data);
  if (fullData) {
    try { localStorage.setItem(`careercraft_cv_${id}`, JSON.stringify(fullData)); } catch {}
  }
}

export function trackInterviewPrep(event: Omit<InterviewEvent, "date" | "id">, fullData?: Record<string, unknown>) {
  const id = genId();
  const data = getAnalytics();
  data.interviewPreps.unshift({ ...event, id, date: new Date().toISOString() });
  save(data);
  if (fullData) {
    try { localStorage.setItem(`careercraft_prep_${id}`, JSON.stringify(fullData)); } catch {}
  }
}

export function getSavedCv(id: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`careercraft_cv_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getSavedPrep(id: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`careercraft_prep_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function trackEnquiry(event: Omit<EnquiryEvent, "date">) {
  const data = getAnalytics();
  data.enquiries.unshift({ ...event, date: new Date().toISOString() });
  save(data);
}

export function trackProposal(event: Omit<ProposalEvent, "date">) {
  const data = getAnalytics();
  data.proposals.unshift({ ...event, date: new Date().toISOString() });
  save(data);
}
