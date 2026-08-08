-- Site-wide switches the admin flips from the dashboard.
--
-- Starts with one: whether the paywall is live. Turning it off makes CV and
-- interview-prep downloads free for everyone (a giveaway/promo run); turning
-- it back on resumes M-Pesa collection. Kept in the database rather than an
-- env var so it takes effect the moment it is toggled, with no redeploy.
--
-- Singleton (id = 1), same shape as opportunity_scan_settings. Later flags
-- become columns here rather than new one-row tables.

create table if not exists public.app_settings (
  id               smallint    primary key default 1,
  payments_enabled boolean     not null default true,
  updated_at       timestamptz not null default now()
);

do $$ begin
  alter table public.app_settings
    add constraint app_settings_singleton check (id = 1);
exception when duplicate_object then null; end $$;

-- Seeded enabled: the safe default is that clients pay. A missing row must
-- never read as "everything is free".
insert into public.app_settings (id, payments_enabled)
values (1, true)
on conflict (id) do nothing;

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

comment on table public.app_settings is
  'Singleton (id = 1) holding site-wide admin switches.';
comment on column public.app_settings.payments_enabled is
  'False = giveaway mode: downloads are free and no M-Pesa prompt is sent. Defaults true so a read failure can never open the paywall.';

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
