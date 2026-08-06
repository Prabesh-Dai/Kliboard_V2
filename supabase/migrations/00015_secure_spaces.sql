alter table public.spaces
  add constraint private_requires_password
  check (is_private = false or password_hash is not null);

alter table public.spaces
  add constraint private_requires_owner
  check (is_private = false or owner_id is not null);

create index if not exists idx_spaces_private on public.spaces (is_private)
  where is_private = true;

drop policy if exists "Logged-in users can update unlocked spaces" on public.spaces;

drop policy if exists "Files are viewable if space is accessible" on public.files;

create policy "Files are viewable if space is public or owned"
  on public.files for select
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and (spaces.is_private = false or spaces.owner_id = auth.uid())
    )
  );

drop policy if exists "Logged-in users can add files to unlocked spaces" on public.files;

create policy "Logged-in users can add files to unlocked public spaces"
  on public.files for insert
  with check (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and spaces.is_locked = false
      and spaces.is_private = false
      and auth.uid() is not null
    )
  );

drop policy if exists "Logged-in users can delete files in unlocked spaces" on public.files;

create policy "Logged-in users can delete files in unlocked public spaces"
  on public.files for delete
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and spaces.is_locked = false
      and spaces.is_private = false
      and auth.uid() is not null
    )
  );

drop policy if exists "Authenticated users can read space-files" on storage.objects;

create policy "Read space-files for public or owned spaces"
  on storage.objects for select
  using (
    bucket_id = 'space-files'
    and auth.uid() is not null
    and exists (
      select 1 from public.spaces s
      where s.name = split_part(storage.objects.name, '/', 1)
      and (s.is_private = false or s.owner_id = auth.uid())
    )
  );

drop policy if exists "Authenticated users can delete their uploads" on storage.objects;

create policy "Delete space-files outside others' private spaces"
  on storage.objects for delete
  using (
    bucket_id = 'space-files'
    and auth.uid() is not null
    and not exists (
      select 1 from public.spaces s
      where s.name = split_part(storage.objects.name, '/', 1)
      and s.is_private = true
      and s.owner_id is distinct from auth.uid()
    )
  );
