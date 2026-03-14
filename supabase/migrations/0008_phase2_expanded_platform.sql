create table if not exists public.p2p_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  display_name text not null,
  handle text not null,
  destination_reference text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint p2p_contacts_status_check check (status in ('active', 'pending', 'blocked'))
);

create table if not exists public.p2p_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.p2p_contacts(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric(14, 2) not null,
  direction text not null,
  status public.transfer_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint p2p_transfers_direction_check check (direction in ('sent', 'requested'))
);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  legal_name text not null,
  industry text not null,
  tax_id_masked text not null,
  status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  constraint business_profiles_status_check check (status in ('active', 'pending_review', 'inactive'))
);

create table if not exists public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  membership_role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint business_memberships_role_check check (membership_role in ('owner', 'operator', 'viewer')),
  constraint business_memberships_status_check check (status in ('active', 'invited', 'disabled'))
);

create table if not exists public.wire_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  beneficiary_name text not null,
  beneficiary_bank text not null,
  routing_number_masked text not null,
  account_number_last4 text not null,
  amount numeric(14, 2) not null,
  purpose text not null,
  status public.transfer_status not null default 'pending',
  review_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  constraint wire_transfers_review_status_check check (review_status in ('pending_review', 'approved', 'flagged'))
);

create table if not exists public.credit_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  score integer not null,
  score_band text not null,
  updated_at timestamptz not null default now(),
  constraint credit_profiles_score_band_check check (score_band in ('excellent', 'good', 'fair', 'poor'))
);

create table if not exists public.credit_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null,
  reason_codes jsonb not null default '[]'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists public.wallet_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  provider text not null,
  device_label text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint wallet_tokens_provider_check check (provider in ('apple_pay', 'google_pay')),
  constraint wallet_tokens_status_check check (status in ('active', 'suspended', 'pending'))
);

create index if not exists idx_p2p_contacts_user_id on public.p2p_contacts(user_id);
create index if not exists idx_p2p_transfers_user_id on public.p2p_transfers(user_id);
create index if not exists idx_business_profiles_user_id on public.business_profiles(user_id);
create index if not exists idx_business_memberships_user_id on public.business_memberships(user_id);
create index if not exists idx_wire_transfers_user_id on public.wire_transfers(user_id);
create index if not exists idx_credit_profiles_user_id on public.credit_profiles(user_id);
create index if not exists idx_credit_score_snapshots_user_id on public.credit_score_snapshots(user_id);
create index if not exists idx_wallet_tokens_user_id on public.wallet_tokens(user_id);

alter table public.p2p_contacts enable row level security;
alter table public.p2p_transfers enable row level security;
alter table public.business_profiles enable row level security;
alter table public.business_memberships enable row level security;
alter table public.wire_transfers enable row level security;
alter table public.credit_profiles enable row level security;
alter table public.credit_score_snapshots enable row level security;
alter table public.wallet_tokens enable row level security;

drop policy if exists "p2p_contacts_select_owner_or_admin" on public.p2p_contacts;
create policy "p2p_contacts_select_owner_or_admin"
on public.p2p_contacts for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "p2p_contacts_insert_owner_or_admin" on public.p2p_contacts;
create policy "p2p_contacts_insert_owner_or_admin"
on public.p2p_contacts for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "p2p_transfers_select_owner_or_admin" on public.p2p_transfers;
create policy "p2p_transfers_select_owner_or_admin"
on public.p2p_transfers for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "p2p_transfers_insert_owner_or_admin" on public.p2p_transfers;
create policy "p2p_transfers_insert_owner_or_admin"
on public.p2p_transfers for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "business_profiles_select_member_or_admin" on public.business_profiles;
create policy "business_profiles_select_member_or_admin"
on public.business_profiles for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.business_memberships
    where public.business_memberships.business_profile_id = id
      and public.business_memberships.user_id = auth.uid()
  )
);

drop policy if exists "business_profiles_insert_owner_or_admin" on public.business_profiles;
create policy "business_profiles_insert_owner_or_admin"
on public.business_profiles for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "business_memberships_select_member_or_admin" on public.business_memberships;
create policy "business_memberships_select_member_or_admin"
on public.business_memberships for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "business_memberships_insert_owner_or_admin" on public.business_memberships;
create policy "business_memberships_insert_owner_or_admin"
on public.business_memberships for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wire_transfers_select_owner_or_admin" on public.wire_transfers;
create policy "wire_transfers_select_owner_or_admin"
on public.wire_transfers for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wire_transfers_insert_owner_or_admin" on public.wire_transfers;
create policy "wire_transfers_insert_owner_or_admin"
on public.wire_transfers for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wire_transfers_update_owner_or_admin" on public.wire_transfers;
create policy "wire_transfers_update_owner_or_admin"
on public.wire_transfers for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "credit_profiles_select_owner_or_admin" on public.credit_profiles;
create policy "credit_profiles_select_owner_or_admin"
on public.credit_profiles for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "credit_score_snapshots_select_owner_or_admin" on public.credit_score_snapshots;
create policy "credit_score_snapshots_select_owner_or_admin"
on public.credit_score_snapshots for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallet_tokens_select_owner_or_admin" on public.wallet_tokens;
create policy "wallet_tokens_select_owner_or_admin"
on public.wallet_tokens for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallet_tokens_insert_owner_or_admin" on public.wallet_tokens;
create policy "wallet_tokens_insert_owner_or_admin"
on public.wallet_tokens for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "wallet_tokens_update_owner_or_admin" on public.wallet_tokens;
create policy "wallet_tokens_update_owner_or_admin"
on public.wallet_tokens for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
select 'customer-documents', 'customer-documents', false
where not exists (
  select 1 from storage.buckets where id = 'customer-documents'
);
