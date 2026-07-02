import { supabase } from "@/lib/supabase/client";

export async function trackCvDownload(
  event: { name: string; template: string },
  fullData?: Record<string, unknown>
) {
  await supabase.from("cvs").insert({
    user_id: null,
    full_name: event.name,
    template: event.template,
    data: fullData ?? event,
  });
}

export async function trackInterviewPrep(
  event: { name: string; role: string },
  fullData?: Record<string, unknown>
) {
  await supabase.from("interview_preps").insert({
    user_id: null,
    candidate_name: event.name,
    role_title: event.role,
    data: fullData ?? event,
  });
}

export async function trackEnquiry(event: {
  name: string; email: string; phone: string; service: string; message: string;
}) {
  await supabase.from("enquiries").insert({
    name: event.name,
    email: event.email,
    phone: event.phone,
    service: event.service,
    message: event.message,
  });
}

export async function trackProposal(event: { name: string }) {
  await supabase.from("proposals").insert({ name: event.name, data: event });
}
