-- M-Pesa payment results from PayHero.
--
-- Append-only: every callback and every status poll inserts a row rather than
-- updating one, so a payment's whole history stays auditable and a late or
-- duplicated callback can never overwrite a confirmed result. Reads take the
-- most recent row for a reference (src/lib/payhero.ts, lookupPaymentStatus),
-- and that lookup is what gates a paid download — so this table is the record
-- that decides whether a CV or prep pack is released.

-- There is deliberately no `created_at`: rows are never updated, so a separate
-- insert timestamp would only duplicate `updated_at`. (Adding one now would
-- also have to backfill the existing rows with now(), stamping historical
-- payments with a time they did not happen.)
create table if not exists public.payhero_status (
  id                  uuid        primary key default gen_random_uuid(),
  checkout_request_id text,
  external_reference  text,
  status              text        not null,
  raw                 jsonb,
  updated_at          timestamptz not null default now()
);

alter table public.payhero_status add column if not exists raw        jsonb;
alter table public.payhero_status add column if not exists updated_at timestamptz not null default now();

-- A row with neither reference can never be looked up, so it is pure noise —
-- recordPaymentStatus() already returns early on that case, and this keeps it
-- true at the storage level.
do $$ begin
  alter table public.payhero_status
    add constraint payhero_status_reference_present
    check (checkout_request_id is not null or external_reference is not null);
exception when duplicate_object then null; end $$;

-- `status` is intentionally unconstrained. derivePayheroStatus() normalises
-- the shapes it recognises to SUCCESS / FAILED / PENDING, but PayHero and the
-- underlying Daraja callbacks can surface other strings, and a rejected insert
-- would lose the record of a real payment. Only 'SUCCESS' unlocks a download.

-- A lookup is "latest row for this reference", so the sort column belongs in
-- the index. Partial, because most rows carry only one of the two references.
create index if not exists payhero_status_checkout_request_id_idx
  on public.payhero_status (checkout_request_id, updated_at desc)
  where checkout_request_id is not null;

create index if not exists payhero_status_external_reference_idx
  on public.payhero_status (external_reference, updated_at desc)
  where external_reference is not null;

comment on table  public.payhero_status is
  'Append-only log of PayHero payment results; the newest row for a reference is the current status.';
comment on column public.payhero_status.updated_at is
  'When this observation was recorded — effectively the insert time, since rows are never updated. It is the column reads order by.';
comment on column public.payhero_status.raw is
  'Verbatim PayHero callback/poll body, kept for reconciling disputed payments.';

alter table public.payhero_status enable row level security;
revoke all on public.payhero_status from anon, authenticated;
