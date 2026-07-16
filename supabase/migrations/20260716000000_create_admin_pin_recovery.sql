create table if not exists public.admin_pin_recovery_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_pin_recovery_email_created
  on public.admin_pin_recovery_challenges (email, created_at desc);

alter table public.admin_pin_recovery_challenges enable row level security;
revoke all on public.admin_pin_recovery_challenges from anon, authenticated, public;

-- Recovery challenges are accessed only by the server-side service-role API.
-- No client role receives table access.
