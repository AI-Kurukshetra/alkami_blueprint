alter table public.transfers
  alter column to_account drop not null;

alter table public.transfers
  add column if not exists external_destination text,
  add column if not exists rail text not null default 'internal';

update public.transfers
set rail = 'internal'
where rail is distinct from 'internal';

alter table public.transfers
  drop constraint if exists transfers_rail_check;

alter table public.transfers
  add constraint transfers_rail_check check (rail in ('internal', 'ach'));

drop policy if exists "bills_update_owner_or_admin" on public.bills;
create policy "bills_update_owner_or_admin"
on public.bills for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
