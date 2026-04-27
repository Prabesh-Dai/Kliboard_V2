create index if not exists idx_spaces_active_anon
  on public.spaces (expires_at)
  where owner_id is null;
