-- Fixes three things that only showed up once 0001-0005 were applied and the
-- resulting schema was read back.

-- ---------------------------------------------------------------------------
-- 1. Leftover INSERT policies on enquiries and proposals.
-- ---------------------------------------------------------------------------
-- Four policies survived from the earlier version of the site, two per table
-- (the same rule applied twice under different names), each granting the
-- Postgres `public` role — i.e. every role — INSERT with a `true` check.
--
-- They are inert today because 0004 revoked the underlying grants, and
-- PostgREST needs both a grant and a policy. But they contradict the access
-- model the rest of the schema is built on, and they are a loaded gun: a
-- single future `grant insert ... to anon` would turn them into an open,
-- unauthenticated write path into the admin's inbox.
--
-- Nothing needs them. When the contact form is wired up it will post to a
-- Next.js route that writes with the service role, which bypasses RLS.

drop policy if exists "Anyone can submit an enquiry"  on public.enquiries;
drop policy if exists "Anyone insert enquiry"         on public.enquiries;
drop policy if exists "Anyone can submit a proposal"  on public.proposals;
drop policy if exists "Anyone insert proposal"        on public.proposals;

-- ---------------------------------------------------------------------------
-- 2. payhero_status indexes that 0003 could not replace.
-- ---------------------------------------------------------------------------
-- Two plain single-column indexes already existed under exactly the names
-- 0003 wanted, so its `create index if not exists` matched on name and did
-- nothing — leaving the intended definition unapplied. Dropping first is the
-- only way to change an index's definition.
--
-- The intended shape carries the sort column, because a lookup is always
-- "newest row for this reference" (lookupPaymentStatus), and is partial
-- because most rows carry only one of the two references.

drop index if exists public.payhero_status_checkout_request_id_idx;
drop index if exists public.payhero_status_external_reference_idx;

create index payhero_status_checkout_request_id_idx
  on public.payhero_status (checkout_request_id, updated_at desc)
  where checkout_request_id is not null;

create index payhero_status_external_reference_idx
  on public.payhero_status (external_reference, updated_at desc)
  where external_reference is not null;

-- ---------------------------------------------------------------------------
-- 3. Redundant standalone deadline index.
-- ---------------------------------------------------------------------------
-- No query sorts or filters on deadline alone — listOpportunities always
-- orders by first_seen_at first, which the (first_seen_at desc, deadline)
-- composite from 0002 already serves. This one only cost writes on every scan.

drop index if exists public.opportunities_deadline_idx;
