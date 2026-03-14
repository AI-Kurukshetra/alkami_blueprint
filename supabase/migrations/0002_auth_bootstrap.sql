create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  checking_account_id uuid;
  savings_account_id uuid;
  rent_payee_id uuid;
  utility_payee_id uuid;
  card_payee_id uuid;
  base_name text;
begin
  base_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.users (id, email, name, role, mfa_enabled, created_at)
  values (new.id, new.email, base_name, 'customer', false, now())
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.users.name, excluded.name);

  if not exists (select 1 from public.accounts where user_id = new.id) then
    checking_account_id := gen_random_uuid();
    savings_account_id := gen_random_uuid();

    insert into public.accounts (
      id,
      user_id,
      account_type,
      nickname,
      account_number,
      balance,
      available_balance,
      currency,
      status,
      interest_rate,
      created_at
    )
    values
      (
        checking_account_id,
        new.id,
        'checking',
        'Everyday Checking',
        substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
        2500.00,
        2500.00,
        'USD',
        'active',
        0.010,
        now()
      ),
      (
        savings_account_id,
        new.id,
        'savings',
        'Smart Savings',
        substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
        1200.00,
        1200.00,
        'USD',
        'active',
        3.750,
        now()
      );

    insert into public.cards (
      id,
      user_id,
      account_id,
      card_type,
      network,
      last4,
      status,
      spend_limit,
      created_at
    )
    values (
      gen_random_uuid(),
      new.id,
      checking_account_id,
      'debit',
      'Visa',
      '4821',
      'active',
      2500.00,
      now()
    );

    rent_payee_id := gen_random_uuid();
    utility_payee_id := gen_random_uuid();
    card_payee_id := gen_random_uuid();

    insert into public.payees (
      id,
      user_id,
      name,
      category,
      account_reference,
      is_internal,
      created_at
    )
    values
      (
        rent_payee_id,
        new.id,
        'CityView Apartments',
        'Housing',
        'RENT-4421',
        false,
        now()
      ),
      (
        utility_payee_id,
        new.id,
        'BrightGrid Electric',
        'Utilities',
        'ELEC-2088',
        false,
        now()
      ),
      (
        card_payee_id,
        new.id,
        'NextGen Credit Card',
        'Credit Card',
        'CC-1194',
        false,
        now()
      );

    insert into public.bills (
      id,
      user_id,
      payee_id,
      amount,
      due_date,
      frequency,
      status,
      autopay,
      created_at
    )
    values
      (
        gen_random_uuid(),
        new.id,
        rent_payee_id,
        1450.00,
        current_date + 5,
        'Monthly',
        'scheduled',
        false,
        now()
      ),
      (
        gen_random_uuid(),
        new.id,
        utility_payee_id,
        118.42,
        current_date + 9,
        'Monthly',
        'scheduled',
        true,
        now()
      ),
      (
        gen_random_uuid(),
        new.id,
        card_payee_id,
        225.18,
        current_date + 14,
        'Monthly',
        'scheduled',
        true,
        now()
      );

    insert into public.transactions (
      id,
      account_id,
      amount,
      direction,
      type,
      category,
      description,
      merchant_name,
      posted_at,
      running_balance,
      counterparty_account_id
    )
    values
      (
        gen_random_uuid(),
        checking_account_id,
        3200.00,
        'credit',
        'deposit',
        'Income',
        'Payroll deposit',
        'Acme Payroll',
        now() - interval '10 days',
        3200.00,
        null
      ),
      (
        gen_random_uuid(),
        checking_account_id,
        86.14,
        'debit',
        'purchase',
        'Dining',
        'Morning coffee and breakfast',
        'Starbucks',
        now() - interval '8 days',
        3113.86,
        null
      ),
      (
        gen_random_uuid(),
        checking_account_id,
        58.72,
        'debit',
        'purchase',
        'Transport',
        'Airport trip',
        'Uber',
        now() - interval '7 days',
        3055.14,
        null
      ),
      (
        gen_random_uuid(),
        checking_account_id,
        240.00,
        'debit',
        'transfer',
        'Savings',
        'Weekly transfer to savings',
        null,
        now() - interval '5 days',
        2815.14,
        savings_account_id
      ),
      (
        gen_random_uuid(),
        savings_account_id,
        240.00,
        'credit',
        'transfer',
        'Savings',
        'Weekly transfer from checking',
        null,
        now() - interval '5 days',
        1440.00,
        checking_account_id
      ),
      (
        gen_random_uuid(),
        checking_account_id,
        124.99,
        'debit',
        'purchase',
        'Shopping',
        'Household essentials order',
        'Amazon',
        now() - interval '2 days',
        2690.15,
        null
      );

    insert into public.transfers (
      id,
      user_id,
      from_account,
      to_account,
      amount,
      memo,
      status,
      created_at,
      completed_at
    )
    values (
      gen_random_uuid(),
      new.id,
      checking_account_id,
      savings_account_id,
      240.00,
      'Weekly transfer to savings',
      'completed',
      now() - interval '5 days',
      now() - interval '5 days'
    );

    insert into public.loans (
      id,
      user_id,
      loan_type,
      original_amount,
      balance,
      interest_rate,
      next_payment_date,
      status,
      created_at
    )
    values (
      gen_random_uuid(),
      new.id,
      'auto',
      18450.00,
      12680.33,
      5.490,
      current_date + 12,
      'active',
      now()
    );

    insert into public.notifications (id, user_id, type, message, read, created_at)
    values
      (
        gen_random_uuid(),
        new.id,
        'welcome',
        'Welcome to NextGen Digital Banking. Your accounts are ready.',
        false,
        now()
      ),
      (
        gen_random_uuid(),
        new.id,
        'security',
        'Complete MFA enrollment from Settings to secure your account.',
        false,
        now()
      ),
      (
        gen_random_uuid(),
        new.id,
        'payment',
        'Payroll deposit of $3,200.00 is available in Everyday Checking.',
        false,
        now()
      );

    insert into public.documents (
      id,
      user_id,
      document_type,
      storage_path,
      status,
      created_at
    )
    values (
      gen_random_uuid(),
      new.id,
      'statement',
      format('statements/%s/welcome-statement.pdf', new.id),
      'available',
      now()
    );

    insert into public.support_tickets (
      id,
      user_id,
      subject,
      status,
      priority,
      latest_message,
      created_at
    )
    values (
      gen_random_uuid(),
      new.id,
      'Card controls onboarding',
      'open',
      'medium',
      'Customer requested guidance for card freeze and travel notice settings.',
      now()
    );

    insert into public.audit_logs (
      id,
      user_id,
      action,
      entity,
      entity_id,
      metadata,
      timestamp
    )
    values (
      gen_random_uuid(),
      new.id,
      'auth.signup.bootstrap',
      'users',
      new.id,
      jsonb_build_object('source', 'auth_trigger'),
      now()
    );

    insert into public.financial_goals (
      id,
      user_id,
      name,
      current_amount,
      target_amount,
      target_date,
      status,
      created_at
    )
    values
      (
        gen_random_uuid(),
        new.id,
        'Emergency fund',
        1200.00,
        10000.00,
        current_date + 180,
        'active',
        now()
      ),
      (
        gen_random_uuid(),
        new.id,
        'Vacation savings',
        250.00,
        3000.00,
        current_date + 120,
        'active',
        now()
      );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
