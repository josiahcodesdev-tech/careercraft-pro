# Database

Postgres on Supabase. Schema lives in [`migrations/`](migrations/), numbered and
applied in order.

## Applying

Paste each file into the Supabase SQL Editor, oldest first. Every statement is
idempotent (`create ... if not exists`, guarded `alter ... add constraint`), so
running them against the live database — which already holds these tables from
before the schema was tracked here — adds the missing indexes, constraints,
comments and RLS without touching existing rows.

| Migration | Tables |
| --- | --- |
| `0001_init.sql` | `cv_events`, `interview_events` + the `set_updated_at` helper |
| `0002_opportunities.sql` | `opportunities`, `opportunity_scan_settings` |
| `0003_payments.sql` | `payhero_status` |
| `0004_enquiries_and_proposals.sql` | `enquiries`, `proposals` |
| `0005_archive_legacy.sql` | moves `payments`, `cvs`, `interview_preps`, `profiles` to the `archive` schema |
| `0006_index_and_policy_cleanup.sql` | drops leftover open-INSERT policies and redundant indexes |

All six are applied to the live project (`rbkhdozooexeatwtfxcb`).

## Access model

There are no Supabase Auth users. The app connects with the **service-role key
only** ([`src/lib/supabase-admin.ts`](../src/lib/supabase-admin.ts)), and admin
access is a signed cookie verified in the Next.js layer
([`src/lib/admin-session.ts`](../src/lib/admin-session.ts)).

So every table enables RLS and defines **no policies**: the service role
bypasses RLS, and anon/publishable-key callers can read nothing even if that
key ends up in a browser bundle. Grants to `anon` and `authenticated` are
revoked as well, so the lockdown does not rest on RLS alone.

Two consequences worth remembering:

- `SUPABASE_SERVICE_ROLE_KEY` must never be referenced from a client component
  — it is full, RLS-free access to every table here.
- Adding a table means adding its `enable row level security` + `revoke` lines
  in the same migration. A new table without them is readable by anyone holding
  the publishable key.

## What is where

- **`cv_events` / `interview_events`** — one row per generated CV or prep pack.
  `data` holds the full payload so the admin can reopen and regenerate past
  work. `paid = false` marks an admin-created free download.
- **`opportunities`** — scraped RFPs and jobs, deduplicated on
  `(source, external_id)` so a re-scrape updates rather than duplicates. The
  scan's upsert omits `status`, which is what lets an admin's triage survive
  the next run. Also served publicly at `/api/public/opportunities`, which the
  Pipeline Console syncs from.
- **`opportunity_scan_settings`** — singleton (`id = 1`) pausing both the cron
  and the manual scan.
- **`payhero_status`** — append-only log of M-Pesa results. The newest row for
  a reference is the current status, and `status = 'SUCCESS'` is what releases
  a paid download.
- **`enquiries` / `proposals`** — back the two admin pages that render empty
  today. Both hold a handful of rows from the earlier version of the site, but
  no current code path reads or writes them; see the note atop `0004`.

## The `archive` schema

`payments`, `cvs`, `interview_preps` and `profiles` are leftovers from when the
app had Supabase Auth users and paid tiers. No current code touches them, so
`0005` moved them out of `public` — the rows are intact and readable, they are
simply no longer part of the app's schema or its API surface.

Move one back with `alter table archive.<name> set schema public;`. Delete them
for real only once you're sure that history is worthless.

## Personal data

`cv_events.data` holds full CVs (names, contacts, employment history),
`interview_events.data` holds prep material, and `payhero_status.raw` holds
phone numbers from M-Pesa callbacks. None of it is currently pruned. If you
want a retention window, a scheduled `delete from ... where created_at < now()
- interval '...'` is the smallest thing that would work — but decide the window
before writing it, since regenerating a past CV depends on the row still
existing.

## Types

Queries currently cast the client to `any` at the boundary (see the note atop
[`src/lib/analytics.ts`](../src/lib/analytics.ts)) because no generated
`Database` type exists. Once the migrations are applied,
`supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
would let `getSupabaseAdmin()` be typed and those casts dropped.
