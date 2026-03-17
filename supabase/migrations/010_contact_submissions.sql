-- ── Migration 010: Contact Submissions ───────────────────────────────────────
-- Stores submissions from the public /contact form.
-- RLS: INSERT is public (unauthenticated); SELECT is service role only.

create table if not exists public.contact_submissions (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null,
  organization    text,
  subject         text not null default 'General Inquiry',
  message         text not null,
  created_at      timestamptz not null default now()
);

-- Enable RLS
alter table public.contact_submissions enable row level security;

-- Public can INSERT (unauthenticated form submissions)
create policy "Anyone can submit contact form"
  on public.contact_submissions
  for insert
  to anon, authenticated
  with check (true);

-- Only service role can SELECT (server-side admin reading submissions)
-- No SELECT policy for anon/authenticated = denied by default (RLS enforced).
-- Use the service role key server-side to read submissions.

-- Index for time-ordered reads
create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

comment on table public.contact_submissions is
  'Contact form submissions from the public marketing site.';
