alter table public.spaces
  add column if not exists encryption_version smallint,
  add column if not exists kdf_salt text,
  add column if not exists kdf_iterations integer,
  add column if not exists wrapped_dek text;

alter table public.spaces
  add constraint encrypted_requires_private_params
  check (
    encryption_version is null
    or (
      is_private = true
      and kdf_salt is not null
      and kdf_iterations is not null
      and wrapped_dek is not null
    )
  );

alter table public.files
  add column if not exists encryption_version smallint;

drop policy if exists "Constrained uploads to space-files" on storage.objects;

create policy "Constrained uploads to space-files"
  on storage.objects for insert
  with check (
    bucket_id = 'space-files'
    and name ~ '^[a-z][a-z-]*[a-z]/.+'
    and coalesce((metadata->>'size')::bigint, 0) <= 10485760
    and not exists (
      select 1 from public.spaces s
      where s.name = split_part(storage.objects.name, '/', 1)
      and s.is_private = true
    )
    and (
      lower(coalesce(metadata->>'mimetype', '')) in (
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'text/markdown',
        'application/json',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'audio/webm',
        'audio/mp4',
        'audio/x-m4a',
        'audio/m4a',
        'audio/aac',
        'audio/ogg',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/wave',
        'audio/x-wav'
      )
      or (
        lower(coalesce(metadata->>'mimetype', '')) = 'application/octet-stream'
        and not exists (
          select 1 from public.spaces s
          where s.name = split_part(storage.objects.name, '/', 1)
          and s.encryption_version is null
        )
      )
    )
  );

drop policy if exists "Delete space-files outside others' private spaces" on storage.objects;

create policy "Delete space-files for owners or unlocked public spaces"
  on storage.objects for delete
  using (
    bucket_id = 'space-files'
    and auth.uid() is not null
    and (
      not exists (
        select 1 from public.spaces s
        where s.name = split_part(storage.objects.name, '/', 1)
      )
      or exists (
        select 1 from public.spaces s
        where s.name = split_part(storage.objects.name, '/', 1)
        and (
          s.owner_id = auth.uid()
          or (s.is_private = false and s.is_locked = false)
        )
      )
    )
  );
