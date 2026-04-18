create table public.superadmins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.superadmins enable row level security;

create policy "Only superadmins can read superadmins"
  on public.superadmins for select
  using (
    auth.uid() in (select user_id from public.superadmins)
  );
