-- Agendaí v1.0 — executar em projeto Supabase de teste antes de produção.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  category text,
  description text,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 5 and 480),
  price numeric(10,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  unique (business_id, weekday),
  check (is_closed or (open_time is not null and close_time is not null and close_time > open_time))
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid not null references public.services(id),
  client_id uuid not null references public.profiles(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed','no_show')),
  notes text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);
create index if not exists appointments_business_start_idx on public.appointments(business_id,start_at);
create index if not exists appointments_client_start_idx on public.appointments(client_id,start_at);

-- Cria/atualiza perfil automaticamente quando um usuário é criado no Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id,full_name,email)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email)
  on conflict(id) do update set email=excluded.email;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.business_hours enable row level security;
alter table public.appointments enable row level security;

-- Profiles: o próprio usuário lê/edita seu perfil; dados básicos podem ser lidos
-- por participantes envolvidos por meio de políticas específicas/joins controlados.
create policy "profile_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profile_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profile_read_appointment_participant" on public.profiles for select using (
  exists(select 1 from public.appointments a where a.client_id=id and (
    a.client_id=auth.uid() or exists(select 1 from public.businesses b where b.id=a.business_id and b.owner_id=auth.uid())
  ))
);

create policy "businesses_public_read_active" on public.businesses for select using (is_active = true or owner_id = auth.uid());
create policy "businesses_owner_insert" on public.businesses for insert with check (owner_id = auth.uid());
create policy "businesses_owner_update" on public.businesses for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "businesses_owner_delete" on public.businesses for delete using (owner_id = auth.uid());

create policy "services_public_read_active" on public.services for select using (
  is_active = true or exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())
);
create policy "services_owner_insert" on public.services for insert with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "services_owner_update" on public.services for update using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));
create policy "services_owner_delete" on public.services for delete using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));

create policy "hours_public_read" on public.business_hours for select using (true);
create policy "hours_owner_all" on public.business_hours for all using (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())) with check (exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()));

create policy "appointments_participant_read" on public.appointments for select using (
  client_id=auth.uid() or exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())
);
-- Escrita de agendamentos somente pelas RPCs SECURITY DEFINER.
revoke insert, update, delete on public.appointments from anon, authenticated;

grant select on public.businesses, public.services, public.business_hours to anon, authenticated;
grant insert, update, delete, select on public.businesses, public.services, public.business_hours to authenticated;
grant select on public.appointments to authenticated;
grant select, update on public.profiles to authenticated;

-- Verifica horário de funcionamento e conflito; usa lock consultivo por estabelecimento.
create or replace function public.create_appointment(
  p_business_id uuid, p_service_id uuid, p_start_at timestamptz, p_notes text default ''
) returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_service public.services%rowtype;
  v_business public.businesses%rowtype;
  v_end timestamptz;
  v_local_start timestamp;
  v_weekday integer;
  v_hours public.business_hours%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'Faça login para agendar.'; end if;
  select * into v_business from public.businesses where id=p_business_id and is_active=true;
  if not found then raise exception 'Estabelecimento indisponível.'; end if;
  select * into v_service from public.services where id=p_service_id and business_id=p_business_id and is_active=true;
  if not found then raise exception 'Serviço indisponível.'; end if;
  if p_start_at <= now() then raise exception 'Escolha um horário futuro.'; end if;
  if extract(minute from (p_start_at at time zone 'America/Porto_Velho'))::integer % 15 <> 0
     or extract(second from (p_start_at at time zone 'America/Porto_Velho'))::integer <> 0 then
    raise exception 'Escolha um horário em intervalos de 15 minutos.';
  end if;

  v_end := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_local_start := p_start_at at time zone 'America/Porto_Velho';
  v_weekday := extract(dow from v_local_start)::integer;
  select * into v_hours from public.business_hours where business_id=p_business_id and weekday=v_weekday;
  if not found or v_hours.is_closed then raise exception 'Estabelecimento fechado neste dia.'; end if;
  if v_local_start::time < v_hours.open_time or (v_end at time zone 'America/Porto_Velho')::time > v_hours.close_time then
    raise exception 'Horário fora do funcionamento.'; end if;

  perform pg_advisory_xact_lock(hashtext(p_business_id::text));
  if exists (
    select 1 from public.appointments a
    where a.business_id=p_business_id and a.status='scheduled'
      and a.start_at < v_end and a.end_at > p_start_at
  ) then raise exception 'Este horário acabou de ser reservado. Escolha outro.'; end if;

  insert into public.appointments(business_id,service_id,client_id,start_at,end_at,notes)
  values(p_business_id,p_service_id,v_user,p_start_at,v_end,nullif(trim(p_notes),''))
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Faça login.'; end if;
  update public.appointments set status='cancelled'
  where id=p_appointment_id and status='scheduled'
    and (client_id=v_user or exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=v_user));
  if not found then raise exception 'Agendamento não encontrado ou não pode ser cancelado.'; end if;
  return true;
end; $$;

grant execute on function public.create_appointment(uuid,uuid,timestamptz,text) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
