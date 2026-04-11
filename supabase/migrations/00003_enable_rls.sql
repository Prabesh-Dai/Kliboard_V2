alter table public.spaces enable row level security;
alter table public.files enable row level security;

create policy "Public spaces are viewable by everyone"
  on public.spaces for select
  using (is_private = false);

create policy "Owners can view their private spaces"
  on public.spaces for select
  using (auth.uid() = owner_id);

create policy "Anyone can create spaces"
  on public.spaces for insert
  with check (true);

create policy "Public spaces are updatable by everyone"
  on public.spaces for update
  using (is_private = false);

create policy "Owners can update their spaces"
  on public.spaces for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their spaces"
  on public.spaces for delete
  using (auth.uid() = owner_id);

create policy "Files are viewable if space is accessible"
  on public.files for select
  using (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and (spaces.is_private = false or spaces.owner_id = auth.uid())
    )
  );

create policy "Anyone can add files to accessible spaces"
  on public.files for insert
  with check (
    exists (
      select 1 from public.spaces
      where spaces.id = files.space_id
      and (spaces.is_private = false or spaces.owner_id = auth.uid())
    )
  );
