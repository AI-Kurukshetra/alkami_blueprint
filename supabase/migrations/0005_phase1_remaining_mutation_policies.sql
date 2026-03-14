drop policy if exists "payees_insert_owner_or_admin" on public.payees;
create policy "payees_insert_owner_or_admin"
on public.payees for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "bills_insert_owner_or_admin" on public.bills;
create policy "bills_insert_owner_or_admin"
on public.bills for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "support_tickets_insert_owner_or_admin" on public.support_tickets;
create policy "support_tickets_insert_owner_or_admin"
on public.support_tickets for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "loans_update_owner_or_admin" on public.loans;
create policy "loans_update_owner_or_admin"
on public.loans for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "device_sessions_insert_owner_or_admin" on public.device_sessions;
create policy "device_sessions_insert_owner_or_admin"
on public.device_sessions for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "device_sessions_update_owner_or_admin" on public.device_sessions;
create policy "device_sessions_update_owner_or_admin"
on public.device_sessions for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
