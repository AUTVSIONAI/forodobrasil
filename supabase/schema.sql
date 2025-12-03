create extension if not exists pgcrypto;

create type app_role as enum ('admin','presidente_regional','diretor_regional','membro');
create type registration_role as enum ('pessoa_comum','presidente_regional','diretor_regional','membro');
create type registration_status as enum ('pending','approved','rejected');
create type post_type as enum ('normal','convocacao','alerta','evento');
create type chat_room_type as enum ('geral','regional','grupo');
create type visibility_scope as enum ('all','region');
create type profile_status as enum ('active','suspended');
create type chat_member_role as enum ('owner','moderator','member');

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.regional_roles (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  title text not null,
  description text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index regional_roles_region_idx on public.regional_roles(region_id);

create table public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  region_id uuid references public.regions(id),
  requested_role registration_role not null,
  status registration_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);
create index pending_registrations_region_idx on public.pending_registrations(region_id);
create index pending_registrations_status_idx on public.pending_registrations(status);

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  region_id uuid references public.regions(id),
  role app_role not null,
  directory_role_id uuid references public.regional_roles(id),
  status profile_status not null default 'active',
  created_at timestamptz not null default now()
);
create index user_profiles_region_idx on public.user_profiles(region_id);
create index user_profiles_role_idx on public.user_profiles(role);

create table public.mural_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  media_urls text[] default '{}',
  type post_type not null default 'normal',
  region_id uuid references public.regions(id),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now(),
  is_published boolean not null default true
);
create index mural_posts_type_idx on public.mural_posts(type);
create index mural_posts_region_idx on public.mural_posts(region_id);
create index mural_posts_published_at_idx on public.mural_posts(published_at desc);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  region_id uuid references public.regions(id),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now(),
  visibility visibility_scope not null default 'all',
  is_published boolean not null default true
);
create index videos_region_idx on public.videos(region_id);
create index videos_published_at_idx on public.videos(published_at desc);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  region_id uuid references public.regions(id),
  created_by uuid references auth.users(id),
  is_official boolean not null default true,
  published_at timestamptz not null default now(),
  is_published boolean not null default true
);
create index events_region_idx on public.events(region_id);
create index events_start_at_idx on public.events(start_at);

create table public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type chat_room_type not null,
  region_id uuid references public.regions(id),
  created_by uuid references auth.users(id),
  is_locked boolean not null default false,
  created_at timestamptz not null default now()
);
create index chat_rooms_type_idx on public.chat_rooms(type);
create index chat_rooms_region_idx on public.chat_rooms(region_id);

create table public.chat_members (
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role chat_member_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index chat_members_user_idx on public.chat_members(user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index chat_messages_room_idx on public.chat_messages(room_id);
create index chat_messages_created_idx on public.chat_messages(created_at desc);

create view public.region_member_counts as
select r.id as region_id, r.name as region_name, count(p.user_id) as member_count
from public.regions r
left join public.user_profiles p on p.region_id = r.id and p.status = 'active'
group by r.id, r.name;

alter table public.regions enable row level security;
alter table public.regional_roles enable row level security;
alter table public.pending_registrations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.mural_posts enable row level security;
alter table public.videos enable row level security;
alter table public.events enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_members enable row level security;
alter table public.chat_messages enable row level security;

create or replace function public.is_admin() returns boolean language sql stable as $$
select exists (select 1 from public.user_profiles up where up.user_id = auth.uid() and up.role = 'admin')
$$;

create policy regions_select_authenticated on public.regions for select using (auth.role() = 'authenticated');
create policy regions_admin_all on public.regions for all using (public.is_admin()) with check (public.is_admin());

create policy regional_roles_select_authenticated on public.regional_roles for select using (auth.role() = 'authenticated');
create policy regional_roles_admin_all on public.regional_roles for all using (public.is_admin()) with check (public.is_admin());

create policy registrations_insert_anon on public.pending_registrations for insert with check (auth.role() = 'anon');
create policy registrations_admin_select on public.pending_registrations for select using (public.is_admin());
create policy registrations_admin_update on public.pending_registrations for update using (public.is_admin()) with check (public.is_admin());

create policy profiles_select_self on public.user_profiles for select using (user_id = auth.uid());


create policy mural_select_all on public.mural_posts for select using (
  auth.role() = 'authenticated' and (
    mural_posts.region_id is null or exists (
      select 1 from public.user_profiles me
      where me.user_id = auth.uid()
        and me.region_id = mural_posts.region_id
    )
  )
);
create policy mural_admin_all on public.mural_posts for all using (public.is_admin()) with check (public.is_admin());

create policy videos_select_all on public.videos for select using (
  auth.role() = 'authenticated' and (
    videos.visibility = 'all' or exists (
      select 1 from public.user_profiles me
      where me.user_id = auth.uid()
        and me.region_id = videos.region_id
    )
  )
);
create policy videos_admin_all on public.videos for all using (public.is_admin()) with check (public.is_admin());

create policy events_select_all on public.events for select using (
  auth.role() = 'authenticated' and (
    events.region_id is null or exists (
      select 1 from public.user_profiles me
      where me.user_id = auth.uid()
        and me.region_id = events.region_id
    )
  )
);
create policy events_admin_all on public.events for all using (public.is_admin()) with check (public.is_admin());

create policy rooms_select_geral on public.chat_rooms for select using (auth.role() = 'authenticated' and chat_rooms.type = 'geral');
create policy rooms_select_region on public.chat_rooms for select using (
  auth.role() = 'authenticated' and chat_rooms.type = 'regional' and exists (
    select 1 from public.user_profiles me
    where me.user_id = auth.uid()
      and me.region_id = chat_rooms.region_id
  )
);
create policy rooms_select_grupo_member on public.chat_rooms for select using (
  auth.role() = 'authenticated' and chat_rooms.type = 'grupo' and exists (
    select 1 from public.chat_members cm
    where cm.room_id = chat_rooms.id
      and cm.user_id = auth.uid()
  )
);
create policy rooms_admin_all on public.chat_rooms for all using (public.is_admin()) with check (public.is_admin());

create policy chat_members_select_self on public.chat_members for select using (user_id = auth.uid());
create policy chat_members_admin_all on public.chat_members for all using (public.is_admin()) with check (public.is_admin());

create policy chat_messages_select_room_member on public.chat_messages for select using (
  exists (
    select 1 from public.chat_members me
    where me.room_id = chat_messages.room_id
      and me.user_id = auth.uid()
  )
);
create policy chat_messages_insert_room_member on public.chat_messages for insert with check (
  exists (
    select 1 from public.chat_members me
    where me.room_id = chat_messages.room_id
      and me.user_id = auth.uid()
  )
  and not exists (
    select 1 from public.chat_rooms cr
    where cr.id = chat_messages.room_id
      and cr.is_locked = true
  )
);
create policy chat_messages_admin_all on public.chat_messages for all using (public.is_admin()) with check (public.is_admin());

