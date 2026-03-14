create unique index if not exists idx_credit_profiles_user_unique
on public.credit_profiles(user_id);

create index if not exists idx_wire_transfers_review_status
on public.wire_transfers(review_status);

drop policy if exists "documents_insert_owner_or_admin" on public.documents;
create policy "documents_insert_owner_or_admin"
on public.documents for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "business_memberships_select_same_business_or_admin" on public.business_memberships;
create policy "business_memberships_select_same_business_or_admin"
on public.business_memberships for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.business_memberships memberships
    where memberships.business_profile_id = business_memberships.business_profile_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  )
);

drop policy if exists "fraud_events_insert_admin" on public.fraud_events;
create policy "fraud_events_insert_admin"
on public.fraud_events for insert
with check (public.is_admin());

drop policy if exists "fraud_events_update_admin" on public.fraud_events;
create policy "fraud_events_update_admin"
on public.fraud_events for update
using (public.is_admin())
with check (public.is_admin());
