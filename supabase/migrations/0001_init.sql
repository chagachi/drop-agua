-- Drop Água — schema inicial (profiles, empresas, motoristas, placas, pedidos)
-- RLS: sistema interno multiusuário, dado compartilhado, restrição por papel (profiles.is_admin)

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (estende auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  is_admin    boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- cria profile automaticamente quando um usuário é criado no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- is_admin() / is_active_user() helpers (security definer p/ evitar recursão de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_active_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- guarda contra auto-promoção: usuário comum não pode alterar is_admin/is_active da própria linha
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.is_admin is distinct from old.is_admin
       or new.is_active is distinct from old.is_active then
      raise exception 'Apenas administradores podem alterar permissões.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privilege
  before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();

alter table public.profiles enable row level security;

create policy "profiles_select_self_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- empresas (clientes) — era cadastroempresa
-- ---------------------------------------------------------------------------
create table public.empresas (
  id                 bigint generated always as identity primary key,
  nome_fantasia      text not null,
  razao_social       text,
  cnpj               text,
  ie                 text,
  endereco_cobranca  text,
  endereco_entrega   text,
  numero             text,
  bairro             text,
  cidade             text,
  estado             char(2),
  telefone1          text,
  telefone2          text,
  email              text,
  site               text,
  valor_entrega      numeric(12,2) not null default 0,
  valor_retirada     numeric(12,2) not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index empresas_nome_fantasia_trgm_idx on public.empresas using gin (nome_fantasia gin_trgm_ops);
create index empresas_cnpj_idx on public.empresas (cnpj);

create trigger empresas_set_updated_at
  before update on public.empresas
  for each row execute function public.set_updated_at();

alter table public.empresas enable row level security;

create policy "empresas_select_authenticated"
  on public.empresas for select to authenticated using (true);

create policy "empresas_insert_admin"
  on public.empresas for insert to authenticated with check (public.is_admin());

create policy "empresas_update_admin"
  on public.empresas for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "empresas_delete_admin"
  on public.empresas for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- motoristas — era funcionarios
-- ---------------------------------------------------------------------------
create table public.motoristas (
  id          bigint generated always as identity primary key,
  nome        text not null,
  telefone    text,
  celular     text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index motoristas_nome_idx on public.motoristas (nome);
create index motoristas_is_active_idx on public.motoristas (is_active) where is_active;

create trigger motoristas_set_updated_at
  before update on public.motoristas
  for each row execute function public.set_updated_at();

alter table public.motoristas enable row level security;

create policy "motoristas_select_authenticated"
  on public.motoristas for select to authenticated using (true);

create policy "motoristas_insert_authenticated"
  on public.motoristas for insert to authenticated with check (true);

create policy "motoristas_update_admin"
  on public.motoristas for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "motoristas_delete_admin"
  on public.motoristas for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- placas
-- ---------------------------------------------------------------------------
create table public.placas (
  id          bigint generated always as identity primary key,
  placa       text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger placas_set_updated_at
  before update on public.placas
  for each row execute function public.set_updated_at();

alter table public.placas enable row level security;

create policy "placas_select_authenticated"
  on public.placas for select to authenticated using (true);

create policy "placas_insert_authenticated"
  on public.placas for insert to authenticated with check (true);

create policy "placas_update_admin"
  on public.placas for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "placas_delete_admin"
  on public.placas for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- pedidos (vales) — era pedidos
-- ---------------------------------------------------------------------------
create table public.pedidos (
  id                 bigint generated always as identity primary key,

  empresa_id         bigint not null references public.empresas(id),
  empresa_nome       text not null,
  cnpj               text,

  motorista_id       bigint references public.motoristas(id),
  motorista_nome     text not null,
  placa              text not null,

  local_entrega      text,
  retirada           boolean not null default false,
  valor_unitario     numeric(12,2) not null,
  quantidade_carga   numeric(12,3) not null,
  total_liquido      numeric(14,2) not null,

  observacao         text,
  status             integer not null default 0,

  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index pedidos_empresa_id_idx on public.pedidos (empresa_id);
create index pedidos_motorista_id_idx on public.pedidos (motorista_id);
create index pedidos_created_at_idx on public.pedidos (created_at);
create index pedidos_retirada_idx on public.pedidos (retirada);

create trigger pedidos_set_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

-- só admin pode alterar a data (created_at) de um pedido já existente
create or replace function public.prevent_nonadmin_created_at_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() and new.created_at is distinct from old.created_at then
    raise exception 'Apenas administradores podem alterar a data do pedido.';
  end if;
  return new;
end;
$$;

create trigger pedidos_guard_created_at
  before update on public.pedidos
  for each row execute function public.prevent_nonadmin_created_at_change();

alter table public.pedidos enable row level security;

create policy "pedidos_select_authenticated"
  on public.pedidos for select to authenticated using (true);

create policy "pedidos_insert_authenticated"
  on public.pedidos for insert to authenticated with check (true);

create policy "pedidos_update_authenticated"
  on public.pedidos for update to authenticated
  using (true) with check (true);

create policy "pedidos_delete_admin"
  on public.pedidos for delete to authenticated using (public.is_admin());
