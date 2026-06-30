import { supabase } from "@/lib/supabase/client";

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

export async function trackCvDownload(event: Omit<CvEvent, "date" | "id">, fullData?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  await supabase.from("cvs").insert({
    user_id: session?.user.id ?? null,
    full_name: event.name,
    template: event.template,
    data: fullData ?? event,
  });
}

export async function trackInterviewPrep(event: Omit<InterviewEvent, "date" | "id">, fullData?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  await supabase.from("interview_preps").insert({
    user_id: session?.user.id ?? null,
    candidate_name: event.name,
    role_title: event.role,
    data: fullData ?? event,
  });
}

export async function trackEnquiry(event: Omit<EnquiryEvent, "date">) {
  await supabase.from("enquiries").insert({
    name: event.name,
    email: event.email,
    phone: event.phone,
    service: event.service,
    message: event.message,
  });
}

export async function trackProposal(event: Omit<ProposalEvent, "date">) {
  await supabase.from("proposals").insert({ name: event.name, data: event });
}
