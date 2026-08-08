-- Scraped RFPs and jobs, plus the on/off switch for the daily scan.
--
-- Written by src/lib/opportunity-scan.ts (cron + "Scan now"), read by the
-- admin table and by the public feed at /api/public/opportunities that the
-- Pipeline Console syncs from.

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------

create table if not exists public.opportunities (
  id            uuid        primary key default gen_random_uuid(),
  source        text        not null,
  external_id   text        not null,
  title         text        not null,
  organization  text,
  category      text        not null,
  location      text,
  deadline      date,
  source_url    text        not null,
  status        text        not null default 'new',
  raw           jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

alter table public.opportunities add column if not exists organization  text;
alter table public.opportunities add column if not exists location      text;
alter table public.opportunities add column if not exists deadline      date;
alter table public.opportunities add column if not exists raw           jsonb;
alter table public.opportunities add column if not exists status        text        not null default 'new';
alter table public.opportunities add column if not exists first_seen_at timestamptz not null default now();
alter table public.opportunities add column if not exists last_seen_at  timestamptz not null default now();

-- `category` and `status` are closed sets that drive the admin filters and the
-- public feed's `type` field, so they're constrained here.
--
-- `source` deliberately is NOT constrained: a scan collects every scraper's
-- drafts and upserts them in one statement, so a CHECK that lagged behind a
-- newly-added scraper would fail the whole run, not just the new source.
-- Current values: reliefweb, devnetjobs, undp, worldbank, ungm.
do $$ begin
  alter table public.opportunities
    add constraint opportunities_category_check check (category in ('rfp', 'job'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.opportunities
    add constraint opportunities_status_check
    check (status in ('new', 'reviewing', 'applied', 'ignored'));
exception when duplicate_object then null; end $$;

-- Named so PostgREST can target it as the upsert conflict key — the scan
-- calls .upsert(..., { onConflict: "source,external_id" }), which is what
-- makes a re-scrape update a notice instead of duplicating it.
create unique index if not exists opportunities_source_external_id_key
  on public.opportunities (source, external_id);

-- Mirrors listOpportunities()' sort exactly: newest scrape batch first, then
-- soonest deadline within a batch (ASC puts NULLs last by default, which is
-- the `nullsFirst: false` the query asks for).
create index if not exists opportunities_first_seen_deadline_idx
  on public.opportunities (first_seen_at desc, deadline);

-- getLastScan() reads the newest last_seen_at, then counts rows at exactly
-- that timestamp.
create index if not exists opportunities_last_seen_at_idx
  on public.opportunities (last_seen_at desc);

-- The admin's default view is status = 'new'. Category and source are left
-- unindexed on purpose: both are low-cardinality over a table this size, so
-- an index would cost writes on every scan and buy nothing.
create index if not exists opportunities_status_idx
  on public.opportunities (status);

-- The live table also carries a `created_at` column that no code reads or
-- writes and that duplicates first_seen_at. It is left alone here and dropped
-- in 0005 rather than being adopted into the canonical shape.

comment on table  public.opportunities is
  'Scraped RFPs and jobs, deduplicated on (source, external_id) across scans.';
comment on column public.opportunities.external_id is
  'Id from the source feed, or a synthetic hash where the source has none.';
comment on column public.opportunities.status is
  'Admin triage state. Left out of the scan''s upsert payload so a manual change survives the next re-scrape.';
comment on column public.opportunities.first_seen_at is
  'When the scan first saw this notice — the public feed exposes it as scrapedAt.';
comment on column public.opportunities.last_seen_at is
  'Stamped identically on every row a single scan touches, which is what lets getLastScan() derive that run''s counts without a scan-log table.';
comment on column public.opportunities.raw is
  'Untouched source payload, kept so a parser fix can be replayed without re-fetching.';

alter table public.opportunities enable row level security;
revoke all on public.opportunities from anon, authenticated;


-- ---------------------------------------------------------------------------
-- opportunity_scan_settings — single-row switch (id is always 1).
-- ---------------------------------------------------------------------------
-- One switch pauses both the daily cron and the manual "Scan now" button.

create table if not exists public.opportunity_scan_settings (
  id         smallint    primary key default 1,
  enabled    boolean     not null default true,
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.opportunity_scan_settings
    add constraint opportunity_scan_settings_singleton check (id = 1);
exception when duplicate_object then null; end $$;

insert into public.opportunity_scan_settings (id, enabled)
values (1, true)
on conflict (id) do nothing;

drop trigger if exists opportunity_scan_settings_set_updated_at on public.opportunity_scan_settings;
create trigger opportunity_scan_settings_set_updated_at
  before update on public.opportunity_scan_settings
  for each row execute function public.set_updated_at();

comment on table public.opportunity_scan_settings is
  'Singleton (id = 1) holding the daily-scan on/off switch.';

alter table public.opportunity_scan_settings enable row level security;
revoke all on public.opportunity_scan_settings from anon, authenticated;
