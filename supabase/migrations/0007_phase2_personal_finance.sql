create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null,
  limit_amount numeric(14, 2) not null,
  period text not null default 'monthly',
  alert_threshold numeric(5, 2) not null default 0.80,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, category, period)
);

create table if not exists public.savings_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_account_id uuid not null references public.accounts(id) on delete cascade,
  destination_account_id uuid not null references public.accounts(id) on delete cascade,
  rule_type text not null,
  amount numeric(14, 2) not null,
  cadence text not null,
  active boolean not null default true,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  constraint savings_rules_rule_type_check check (rule_type in ('roundup', 'recurring', 'percentage')),
  constraint savings_rules_cadence_check check (cadence in ('weekly', 'biweekly', 'monthly', 'per_transaction')),
  constraint savings_rules_distinct_accounts_check check (source_account_id <> destination_account_id)
);

create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_savings_rules_user_id on public.savings_rules(user_id);

alter table public.budgets enable row level security;
alter table public.savings_rules enable row level security;

drop policy if exists "budgets_select_owner_or_admin" on public.budgets;
create policy "budgets_select_owner_or_admin"
on public.budgets for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "budgets_insert_owner_or_admin" on public.budgets;
create policy "budgets_insert_owner_or_admin"
on public.budgets for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "budgets_update_owner_or_admin" on public.budgets;
create policy "budgets_update_owner_or_admin"
on public.budgets for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "savings_rules_select_owner_or_admin" on public.savings_rules;
create policy "savings_rules_select_owner_or_admin"
on public.savings_rules for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "savings_rules_insert_owner_or_admin" on public.savings_rules;
create policy "savings_rules_insert_owner_or_admin"
on public.savings_rules for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "savings_rules_update_owner_or_admin" on public.savings_rules;
create policy "savings_rules_update_owner_or_admin"
on public.savings_rules for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
