drop policy if exists "Constrained uploads to space-files" on storage.objects;

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
  );
