create table public.files (
  id           uuid primary key default gen_random_uuid(),
  space_id     uuid not null references public.spaces(id) on delete cascade,
  filename     text not null,
  storage_path text not null,
  mime_type    text not null,
  size_bytes   int not null,
  created_at   timestamptz not null default now()
);

create index idx_files_space_id on public.files (space_id);
