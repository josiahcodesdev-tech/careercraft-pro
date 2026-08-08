-- Backing tables for the two admin pages that currently render an empty list.
--
-- Both tables already exist and already hold rows (4 enquiries, 2 proposals)
-- from an earlier version of the site — but every column was left nullable and
-- unindexed, and no current code path reads or writes them:
-- /api/admin/analytics returns a hard-coded [] for both, and the contact form
-- hands off to WhatsApp rather than posting anywhere. So this migration does
-- not create them so much as tighten them, ready for that wiring.
--
-- The NOT NULLs below were checked against the live rows first — nothing
-- currently stored violates them.

-- ---------------------------------------------------------------------------
-- enquiries — contact-form submissions.
-- ---------------------------------------------------------------------------

create table if not exists public.enquiries (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text,
  phone      text,
  service    text,
  message    text        not null,
  created_at timestamptz not null default now()
);

-- Converge the existing table, whose columns are all nullable.
alter table public.enquiries alter column name       set not null;
alter table public.enquiries alter column message    set not null;
alter table public.enquiries alter column created_at set not null;
alter table public.enquiries alter column created_at set default now();

-- The form asks for one or the other; an enquiry with no way to reply is not
-- an enquiry.
do $$ begin
  alter table public.enquiries
    add constraint enquiries_contact_present
    check (email is not null or phone is not null);
exception when duplicate_object then null; end $$;

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

comment on table  public.enquiries is
  'Contact-form submissions, newest first in /admin/enquiries. Not written to yet — the contact form still hands off to WhatsApp.';
comment on column public.enquiries.service is
  'Which service the enquiry names, free text — matches the form''s select, which changes more often than a constraint would want to.';

alter table public.enquiries enable row level security;
revoke all on public.enquiries from anon, authenticated;


-- ---------------------------------------------------------------------------
-- proposals — proposal / grant work tracked for a client.
-- ---------------------------------------------------------------------------

create table if not exists public.proposals (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  data       jsonb,
  created_at timestamptz not null default now()
);

alter table public.proposals alter column name       set not null;
alter table public.proposals alter column created_at set not null;
alter table public.proposals alter column created_at set default now();

create index if not exists proposals_created_at_idx
  on public.proposals (created_at desc);

comment on table  public.proposals is
  'Proposal and grant activity. /admin/proposals renders only `name` and `created_at` today; `data` is a free-form payload kept from the earlier version.';

alter table public.proposals enable row level security;
revoke all on public.proposals from anon, authenticated;
