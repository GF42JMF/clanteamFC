-- Tablas nuevas de la administración. No modifica ni borra partidos/jugadores existentes.
create table if not exists public.clan_records (
  kind text not null,
  id text not null,
  data jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);
alter table public.clan_records enable row level security;
revoke all on public.clan_records from anon, authenticated;
grant all on public.clan_records to service_role;
create unique index if not exists clan_users_username_unique
  on public.clan_records (lower(data->>'username')) where kind = 'users';
create unique index if not exists clan_users_email_unique
  on public.clan_records (lower(data->>'email')) where kind = 'users';
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('clan-media','clan-media',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
-- El servidor usa la clave secreta; no se habilitan políticas de escritura pública.
