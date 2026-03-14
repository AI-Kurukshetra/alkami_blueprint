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

