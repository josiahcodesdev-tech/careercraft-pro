export interface CvEvent {
  id?: string;
  name: string;
  template: string;
  date: string;
}

export interface InterviewEvent {
  id?: string;
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

export async function trackCvDownload(_event: { name: string; template: string }, _fullData?: Record<string, unknown>) {}
export async function trackInterviewPrep(_event: { name: string; role: string }, _fullData?: Record<string, unknown>) {}
export async function trackEnquiry(_event: { name: string; email: string; phone: string; service: string; message: string }) {}
export async function trackProposal(_event: { name: string }) {}
