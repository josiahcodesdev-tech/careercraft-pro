const STORAGE_KEY = "careercraft_analytics";

export interface CvEvent {
  name: string;
  template: string;
  date: string;
}

export interface InterviewEvent {
  name: string;
  role: string;
  date: string;
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

export function trackCvDownload(event: Omit<CvEvent, "date">) {
  const data = getAnalytics();
  data.cvDownloads.unshift({ ...event, date: new Date().toISOString() });
  save(data);
}

export function trackInterviewPrep(event: Omit<InterviewEvent, "date">) {
  const data = getAnalytics();
  data.interviewPreps.unshift({ ...event, date: new Date().toISOString() });
  save(data);
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
