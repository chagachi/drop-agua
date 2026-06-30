-- Adiciona email em profiles (denormalizado de auth.users) para a tela de
-- administração de usuários poder listar quem é quem sem acessar auth.users
-- diretamente (não exposto via API por padrão).

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

alter table public.profiles alter column email set not null;

-- handle_new_user passa a popular o email também
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;
