create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('customer', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type public.account_type as enum ('checking', 'savings', 'money_market', 'credit');
  end if;

  if not exists (select 1 from pg_type where typname = 'record_status') then
    create type public.record_status as enum ('active', 'inactive', 'blocked', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_direction') then
    create type public.transaction_direction as enum ('debit', 'credit');
  end if;

  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('purchase', 'deposit', 'payment', 'transfer', 'fee', 'refund', 'interest', 'withdrawal');
  end if;

  if not exists (select 1 from pg_type where typname = 'transfer_status') then
    create type public.transfer_status as enum ('pending', 'completed', 'failed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'bill_status') then
    create type public.bill_status as enum ('scheduled', 'paid', 'overdue', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'card_type') then
    create type public.card_type as enum ('debit', 'credit');
  end if;

  if not exists (select 1 from pg_type where typname = 'loan_type') then
    create type public.loan_type as enum ('mortgage', 'auto', 'personal', 'student');
  end if;

  if not exists (select 1 from pg_type where typname = 'support_status') then
    create type public.support_status as enum ('open', 'pending', 'resolved');
  end if;

  if not exists (select 1 from pg_type where typname = 'fraud_severity') then
    create type public.fraud_severity as enum ('low', 'medium', 'high', 'critical');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role public.app_role not null default 'customer',
  phone text,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_type public.account_type not null,
  nickname text not null,
  account_number text not null unique,
  balance numeric(14, 2) not null default 0,
  available_balance numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  status public.record_status not null default 'active',
  interest_rate numeric(6, 3) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount numeric(14, 2) not null,
  direction public.transaction_direction not null,
  type public.transaction_type not null,
  category text not null,
  description text not null,
  merchant_name text,
  posted_at timestamptz not null default now(),
  running_balance numeric(14, 2),
  counterparty_account_id uuid references public.accounts(id) on delete set null
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  from_account uuid not null references public.accounts(id) on delete cascade,
  to_account uuid not null references public.accounts(id) on delete cascade,
  amount numeric(14, 2) not null,
  memo text,
  status public.transfer_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  category text not null,
  account_reference text,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payee_id uuid not null references public.payees(id) on delete cascade,
  amount numeric(14, 2) not null,
  due_date date not null,
  frequency text not null default 'Monthly',
  status public.bill_status not null default 'scheduled',
  autopay boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  card_type public.card_type not null,
  network text not null,
  last4 text not null,
  status public.record_status not null default 'active',
  spend_limit numeric(12, 2),
  created_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  loan_type public.loan_type not null,
  original_amount numeric(14, 2) not null,
  balance numeric(14, 2) not null,
  interest_rate numeric(6, 3) not null,
  next_payment_date date,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status text not null default 'available',
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  status public.support_status not null default 'open',
  priority text not null default 'medium',
  latest_message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  device_fingerprint text not null,
  user_agent text not null,
  ip_address inet,
  trusted boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  severity public.fraud_severity not null,
  rule_name text not null,
  status text not null default 'open',
  payload jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  current_amount numeric(14, 2) not null default 0,
  target_amount numeric(14, 2) not null,
  target_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists idx_accounts_user_id on public.accounts(user_id);
create index if not exists idx_transactions_account_id on public.transactions(account_id);
create index if not exists idx_transactions_posted_at on public.transactions(posted_at desc);
create index if not exists idx_transfers_user_id on public.transfers(user_id);
create index if not exists idx_bills_user_id on public.bills(user_id);
create index if not exists idx_cards_user_id on public.cards(user_id);
create index if not exists idx_loans_user_id on public.loans(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_fraud_events_account_id on public.fraud_events(account_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.users enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;
alter table public.payees enable row level security;
alter table public.bills enable row level security;
alter table public.cards enable row level security;
alter table public.loans enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.device_sessions enable row level security;
alter table public.fraud_events enable row level security;
alter table public.financial_goals enable row level security;

drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin"
on public.users for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin"
on public.users for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "accounts_select_owner_or_admin" on public.accounts;
create policy "accounts_select_owner_or_admin"
on public.accounts for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "transactions_select_owner_or_admin" on public.transactions;
create policy "transactions_select_owner_or_admin"
on public.transactions for select
using (
  exists (
    select 1
    from public.accounts
    where accounts.id = transactions.account_id
      and (accounts.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "transfers_select_owner_or_admin" on public.transfers;
create policy "transfers_select_owner_or_admin"
on public.transfers for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payees_select_owner_or_admin" on public.payees;
create policy "payees_select_owner_or_admin"
on public.payees for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bills_select_owner_or_admin" on public.bills;
create policy "bills_select_owner_or_admin"
on public.bills for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cards_select_owner_or_admin" on public.cards;
create policy "cards_select_owner_or_admin"
on public.cards for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "loans_select_owner_or_admin" on public.loans;
create policy "loans_select_owner_or_admin"
on public.loans for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_select_owner_or_admin" on public.notifications;
create policy "notifications_select_owner_or_admin"
on public.notifications for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "documents_select_owner_or_admin" on public.documents;
create policy "documents_select_owner_or_admin"
on public.documents for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "support_tickets_select_owner_or_admin" on public.support_tickets;
create policy "support_tickets_select_owner_or_admin"
on public.support_tickets for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "audit_logs_select_owner_or_admin" on public.audit_logs;
create policy "audit_logs_select_owner_or_admin"
on public.audit_logs for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "device_sessions_select_owner_or_admin" on public.device_sessions;
create policy "device_sessions_select_owner_or_admin"
on public.device_sessions for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "fraud_events_select_owner_or_admin" on public.fraud_events;
create policy "fraud_events_select_owner_or_admin"
on public.fraud_events for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.accounts
    where accounts.id = fraud_events.account_id
      and accounts.user_id = auth.uid()
  )
);

drop policy if exists "financial_goals_select_owner_or_admin" on public.financial_goals;
create policy "financial_goals_select_owner_or_admin"
on public.financial_goals for select
using (user_id = auth.uid() or public.is_admin());

