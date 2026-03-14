drop policy if exists "accounts_update_owner_or_admin" on public.accounts;
create policy "accounts_update_owner_or_admin"
on public.accounts for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "transfers_insert_owner_or_admin" on public.transfers;
create policy "transfers_insert_owner_or_admin"
on public.transfers for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "transactions_insert_owner_or_admin" on public.transactions;
create policy "transactions_insert_owner_or_admin"
on public.transactions for insert
with check (
  public.is_admin()
  or exists (
    select 1
    from public.accounts
    where public.accounts.id = account_id
      and public.accounts.user_id = auth.uid()
  )
);

drop policy if exists "cards_update_owner_or_admin" on public.cards;
create policy "cards_update_owner_or_admin"
on public.cards for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
