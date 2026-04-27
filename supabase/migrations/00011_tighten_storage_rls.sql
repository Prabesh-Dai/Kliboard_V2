update storage.buckets
  set public = false
  where id = 'space-files';

drop policy if exists "Anyone can upload files" on storage.objects;

create policy "Constrained uploads to space-files"
  on storage.objects for insert
  with check (
    bucket_id = 'space-files'
    and name ~ '^[a-z][a-z-]*[a-z]/.+'
    and coalesce((metadata->>'size')::bigint, 0) <= 10485760
    and lower(coalesce(metadata->>'mimetype', '')) in (
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  );

create policy "Authenticated users can read space-files"
  on storage.objects for select
  using (bucket_id = 'space-files' and auth.uid() is not null);
