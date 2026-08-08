-- Retire what's left of the earlier, auth-based version of the site.
--
-- `payments`, `cvs`, `interview_preps` and `profiles` all carry a `user_id`
-- and date from when the app had Supabase Auth users and paid tiers. Nothing
-- in the current codebase reads or writes any of them — the live equivalents
-- are cv_events / interview_events / payhero_status, which key off a payment
-- reference instead of a user. But they still hold rows (19 / 11 / 2 / 0), and
-- until now they were served by PostgREST like any other public table.
--
-- So: move rather than drop. The data stays byte-for-byte intact and can be
-- read (or moved back) at any time, but it leaves the API surface, and the
-- public schema ends up describing only what the app actually uses.
--
-- To reverse: alter table archive.<name> set schema public;

create schema if not exists archive;

comment on schema archive is
  'Tables from the retired auth-based version of the site. Not served by PostgREST; kept for history only.';

alter table if exists public.payments        set schema archive;
alter table if exists public.cvs             set schema archive;
alter table if exists public.interview_preps set schema archive;
alter table if exists public.profiles        set schema archive;

-- PostgREST only exposes the schemas it is configured with (public), so moving
-- the tables is already what takes them off the API. Revoking schema usage as
-- well means that stays true even if `archive` is ever added to the exposed
-- list by accident.
revoke all on schema archive from anon, authenticated;
revoke all on all tables in schema archive from anon, authenticated;


-- ---------------------------------------------------------------------------
-- opportunities.created_at — redundant, unread.
-- ---------------------------------------------------------------------------
-- No code references it, and it duplicated first_seen_at exactly (checked
-- across all 96 live rows: every value within a second of its first_seen_at).
-- first_seen_at is the one with meaning — it survives re-scrapes, and the
-- public feed exposes it as `scrapedAt`.

alter table public.opportunities drop column if exists created_at;
