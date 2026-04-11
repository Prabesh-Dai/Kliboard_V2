create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null,
  content     text not null default '',
  password_hash text,
  is_private  boolean not null default false,
  duration    int not null,
  expires_at  timestamptz not null,
  owner_id    uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_spaces_expires_at on public.spaces (expires_at);
create index idx_spaces_updated_at on public.spaces (updated_at desc);
create index idx_spaces_owner_id on public.spaces (owner_id);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger spaces_updated_at
  before update on public.spaces
  for each row execute function update_updated_at();
