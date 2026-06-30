-- Faz o toggle "Ativo/Inativo" da tela de usuários realmente bloquear ações,
-- não só esconder na UI. is_active_user() já existia desde 0001 mas não era
-- usada em nenhuma policy.

drop policy "empresas_select_authenticated" on public.empresas;
create policy "empresas_select_authenticated" on public.empresas for select to authenticated using (public.is_active_user());

drop policy "empresas_insert_admin" on public.empresas;
create policy "empresas_insert_admin" on public.empresas for insert to authenticated with check (public.is_admin() and public.is_active_user());

drop policy "empresas_update_admin" on public.empresas;
create policy "empresas_update_admin" on public.empresas for update to authenticated using (public.is_admin() and public.is_active_user()) with check (public.is_admin() and public.is_active_user());

drop policy "empresas_delete_admin" on public.empresas;
create policy "empresas_delete_admin" on public.empresas for delete to authenticated using (public.is_admin() and public.is_active_user());

drop policy "motoristas_select_authenticated" on public.motoristas;
create policy "motoristas_select_authenticated" on public.motoristas for select to authenticated using (public.is_active_user());

drop policy "motoristas_insert_authenticated" on public.motoristas;
create policy "motoristas_insert_authenticated" on public.motoristas for insert to authenticated with check (public.is_active_user());

drop policy "motoristas_update_admin" on public.motoristas;
create policy "motoristas_update_admin" on public.motoristas for update to authenticated using (public.is_admin() and public.is_active_user()) with check (public.is_admin() and public.is_active_user());

drop policy "motoristas_delete_admin" on public.motoristas;
create policy "motoristas_delete_admin" on public.motoristas for delete to authenticated using (public.is_admin() and public.is_active_user());

drop policy "placas_select_authenticated" on public.placas;
create policy "placas_select_authenticated" on public.placas for select to authenticated using (public.is_active_user());

drop policy "placas_insert_authenticated" on public.placas;
create policy "placas_insert_authenticated" on public.placas for insert to authenticated with check (public.is_active_user());

drop policy "placas_update_admin" on public.placas;
create policy "placas_update_admin" on public.placas for update to authenticated using (public.is_admin() and public.is_active_user()) with check (public.is_admin() and public.is_active_user());

drop policy "placas_delete_admin" on public.placas;
create policy "placas_delete_admin" on public.placas for delete to authenticated using (public.is_admin() and public.is_active_user());

drop policy "pedidos_select_authenticated" on public.pedidos;
create policy "pedidos_select_authenticated" on public.pedidos for select to authenticated using (public.is_active_user());

drop policy "pedidos_insert_authenticated" on public.pedidos;
create policy "pedidos_insert_authenticated" on public.pedidos for insert to authenticated with check (public.is_active_user());

drop policy "pedidos_update_authenticated" on public.pedidos;
create policy "pedidos_update_authenticated" on public.pedidos for update to authenticated using (public.is_active_user()) with check (public.is_active_user());

drop policy "pedidos_delete_admin" on public.pedidos;
create policy "pedidos_delete_admin" on public.pedidos for delete to authenticated using (public.is_admin() and public.is_active_user());
