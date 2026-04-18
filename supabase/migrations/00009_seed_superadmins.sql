alter table public.superadmins
  add column granted_via text not null default 'manual';

insert into public.superadmins (user_id, granted_via)
select id, 'migration'
from auth.users
where email in ('prwshshrm@gmail.com', 'buttblaster01@gmail.com')
on conflict (user_id) do nothing;
