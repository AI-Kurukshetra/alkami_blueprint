create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  checking_account_id uuid;
  savings_account_id uuid;
  housing_payee_id uuid;
  utility_payee_id uuid;
  phone_payee_id uuid;
  credit_payee_id uuid;
  checking_account_number text;
  savings_account_number text;
  checking_nickname text;
  savings_nickname text;
  employer_name text;
  utility_name text;
  phone_name text;
  housing_name text;
  card_payee_name text;
  debit_network text;
  credit_network text;
  debit_last4 text;
  credit_last4 text;
  grocery_merchant text;
  coffee_merchant text;
  ride_merchant text;
  shopping_merchant text;
  support_subject text;
  support_message text;
  first_goal_name text;
  second_goal_name text;
  third_goal_name text;
  base_name text;
  checking_balance numeric(14, 2);
  savings_balance numeric(14, 2);
  debit_card_limit numeric(12, 2);
  credit_card_limit numeric(12, 2);
  payroll_amount numeric(14, 2);
  coffee_amount numeric(14, 2);
  ride_amount numeric(14, 2);
  grocery_amount numeric(14, 2);
  shopping_amount numeric(14, 2);
  transfer_amount numeric(14, 2);
  housing_amount numeric(14, 2);
  utility_amount numeric(14, 2);
  phone_amount numeric(14, 2);
  credit_bill_amount numeric(14, 2);
  loan_original_amount numeric(14, 2);
  loan_balance numeric(14, 2);
  loan_rate numeric(6, 3);
  loan_type_value public.loan_type;
  has_credit_card boolean;
  has_loan boolean;
  has_support_ticket boolean;
  has_third_goal boolean;
begin
  base_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, email, name, role, mfa_enabled, created_at)
  values (new.id, new.email, base_name, 'customer', false, now())
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(public.users.name, excluded.name);

  if exists (select 1 from public.accounts where user_id = new.id) then
    return new;
  end if;

  checking_account_id := gen_random_uuid();
  savings_account_id := gen_random_uuid();
  housing_payee_id := gen_random_uuid();
  utility_payee_id := gen_random_uuid();
  phone_payee_id := gen_random_uuid();
  credit_payee_id := gen_random_uuid();

  checking_account_number := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10);
  savings_account_number := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10);
  checking_nickname := (array['Everyday Checking', 'Daily Spend', 'Core Checking', 'Primary Checking'])[1 + floor(random() * 4)::int];
  savings_nickname := (array['Smart Savings', 'Rainy Day Fund', 'Reserve Savings', 'Goal Savings'])[1 + floor(random() * 4)::int];
  employer_name := (array['Acme Payroll', 'Northstar Health', 'Horizon Logistics', 'Cedar Grove Schools', 'Blue Harbor Tech', 'Summit Retail Group'])[1 + floor(random() * 6)::int];
  housing_name := (array['CityView Apartments', 'Harbor Point Residences', 'Maple Terrace Living', 'Oakline Property Mgmt'])[1 + floor(random() * 4)::int];
  utility_name := (array['BrightGrid Electric', 'City Electric', 'Metro Energy', 'Lumen Utilities'])[1 + floor(random() * 4)::int];
  phone_name := (array['Nova Wireless', 'Metro Wireless', 'Signal Mobile', 'Axis Telecom'])[1 + floor(random() * 4)::int];
  debit_network := (array['Visa', 'Mastercard'])[1 + floor(random() * 2)::int];
  credit_network := (array['Visa', 'Mastercard', 'Amex'])[1 + floor(random() * 3)::int];
  grocery_merchant := (array['Whole Foods', 'Trader Joe''s', 'Target', 'Safeway', 'Kroger'])[1 + floor(random() * 5)::int];
  coffee_merchant := (array['Starbucks', 'Blue Bottle', 'Peet''s Coffee', 'Philz Coffee'])[1 + floor(random() * 4)::int];
  ride_merchant := (array['Uber', 'Lyft', 'Waymo'])[1 + floor(random() * 3)::int];
  shopping_merchant := (array['Amazon', 'Target', 'Best Buy', 'Apple Store', 'Nike'])[1 + floor(random() * 5)::int];
  support_subject := (array['Card controls onboarding', 'Travel notice assistance', 'External transfer setup', 'Statement delivery question'])[1 + floor(random() * 4)::int];
  support_message := (array[
    'Customer asked for help configuring card controls and alerts.',
    'Customer wants assistance before upcoming travel.',
    'Customer requested help linking an external account.',
    'Customer asked how to download monthly statements.'
  ])[1 + floor(random() * 4)::int];
  first_goal_name := (array['Emergency fund', 'Home refresh', 'Vacation savings', 'Wedding fund'])[1 + floor(random() * 4)::int];
  second_goal_name := (array['Car down payment', 'New laptop fund', 'Holiday gifts', 'Tuition reserve'])[1 + floor(random() * 4)::int];
  third_goal_name := (array['Investment starter', 'Pet care fund', 'Moving budget', 'Home office upgrade'])[1 + floor(random() * 4)::int];

  checking_balance := round((1500 + random() * 9000)::numeric, 2);
  savings_balance := round((600 + random() * 24000)::numeric, 2);
  debit_card_limit := round((1000 + random() * 4500)::numeric, 2);
  credit_card_limit := round((2500 + random() * 9000)::numeric, 2);
  payroll_amount := round((2200 + random() * 4300)::numeric, 2);
  coffee_amount := round((5 + random() * 18)::numeric, 2);
  ride_amount := round((12 + random() * 54)::numeric, 2);
  grocery_amount := round((48 + random() * 165)::numeric, 2);
  shopping_amount := round((40 + random() * 280)::numeric, 2);
  transfer_amount := round((75 + random() * 650)::numeric, 2);
  housing_amount := round((1100 + random() * 1100)::numeric, 2);
  utility_amount := round((70 + random() * 140)::numeric, 2);
  phone_amount := round((45 + random() * 65)::numeric, 2);
  credit_bill_amount := round((90 + random() * 460)::numeric, 2);
  has_credit_card := random() < 0.68;
  has_loan := random() < 0.56;
  has_support_ticket := random() < 0.42;
  has_third_goal := random() < 0.55;

  debit_last4 := right(checking_account_number, 4);
  credit_last4 := substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4);
  card_payee_name := format('Statement Pay - %s', credit_network);

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
      checking_nickname,
      checking_account_number,
      checking_balance,
      greatest(checking_balance - round((random() * 120)::numeric, 2), 0),
      'USD',
      'active',
      0.010,
      now()
    ),
    (
      savings_account_id,
      new.id,
      'savings',
      savings_nickname,
      savings_account_number,
      savings_balance,
      savings_balance,
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
    debit_network,
    debit_last4,
    'active',
    debit_card_limit,
    now()
  );

  if has_credit_card then
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
      'credit',
      credit_network,
      credit_last4,
      'active',
      credit_card_limit,
      now()
    );
  end if;

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
      housing_payee_id,
      new.id,
      housing_name,
      'Housing',
      format('RENT-%s', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4)),
      false,
      now()
    ),
    (
      utility_payee_id,
      new.id,
      utility_name,
      'Utilities',
      format('UTIL-%s', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4)),
      false,
      now()
    ),
    (
      phone_payee_id,
      new.id,
      phone_name,
      'Phone',
      format('PHONE-%s', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4)),
      false,
      now()
    );

  if has_credit_card then
    insert into public.payees (
      id,
      user_id,
      name,
      category,
      account_reference,
      is_internal,
      created_at
    )
    values (
      credit_payee_id,
      new.id,
      card_payee_name,
      'Credit Card',
      format('CARD-%s', credit_last4),
      false,
      now()
    );
  end if;

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
      housing_payee_id,
      housing_amount,
      current_date + (3 + floor(random() * 10)::int),
      'Monthly',
      'scheduled',
      false,
      now()
    ),
    (
      gen_random_uuid(),
      new.id,
      utility_payee_id,
      utility_amount,
      current_date + (6 + floor(random() * 9)::int),
      'Monthly',
      'scheduled',
      random() < 0.55,
      now()
    ),
    (
      gen_random_uuid(),
      new.id,
      phone_payee_id,
      phone_amount,
      current_date + (8 + floor(random() * 8)::int),
      'Monthly',
      'scheduled',
      true,
      now()
    );

  if has_credit_card then
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
    values (
      gen_random_uuid(),
      new.id,
      credit_payee_id,
      credit_bill_amount,
      current_date + (10 + floor(random() * 10)::int),
      'Monthly',
      'scheduled',
      random() < 0.7,
      now()
    );
  end if;

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
      payroll_amount,
      'credit',
      'deposit',
      'Income',
      format('Payroll deposit from %s', employer_name),
      employer_name,
      now() - interval '12 days',
      null,
      null
    ),
    (
      gen_random_uuid(),
      checking_account_id,
      coffee_amount,
      'debit',
      'purchase',
      'Dining',
      'Coffee and breakfast',
      coffee_merchant,
      now() - interval '9 days',
      null,
      null
    ),
    (
      gen_random_uuid(),
      checking_account_id,
      ride_amount,
      'debit',
      'purchase',
      'Transport',
      'Local transportation',
      ride_merchant,
      now() - interval '7 days',
      null,
      null
    ),
    (
      gen_random_uuid(),
      checking_account_id,
      grocery_amount,
      'debit',
      'purchase',
      'Groceries',
      'Weekly grocery run',
      grocery_merchant,
      now() - interval '6 days',
      null,
      null
    ),
    (
      gen_random_uuid(),
      checking_account_id,
      shopping_amount,
      'debit',
      'purchase',
      'Shopping',
      'Household and personal shopping',
      shopping_merchant,
      now() - interval '3 days',
      null,
      null
    ),
    (
      gen_random_uuid(),
      checking_account_id,
      transfer_amount,
      'debit',
      'transfer',
      'Savings',
      format('Transfer to %s', savings_nickname),
      null,
      now() - interval '2 days',
      null,
      savings_account_id
    ),
    (
      gen_random_uuid(),
      savings_account_id,
      transfer_amount,
      'credit',
      'transfer',
      'Savings',
      format('Transfer from %s', checking_nickname),
      null,
      now() - interval '2 days',
      null,
      checking_account_id
    );

  if random() < 0.35 then
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
    values (
      gen_random_uuid(),
      checking_account_id,
      round((15 + random() * 90)::numeric, 2),
      'credit',
      'refund',
      'Adjustments',
      'Merchant refund',
      shopping_merchant,
      now() - interval '1 day',
      null,
      null
    );
  end if;

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
    transfer_amount,
    format('Auto-save into %s', savings_nickname),
    'completed',
    now() - interval '2 days',
    now() - interval '2 days'
  );

  if has_loan then
    case 1 + floor(random() * 3)::int
      when 1 then
        loan_type_value := 'auto';
        loan_original_amount := round((12000 + random() * 22000)::numeric, 2);
        loan_rate := round((4.200 + random() * 2.400)::numeric, 3);
      when 2 then
        loan_type_value := 'personal';
        loan_original_amount := round((3500 + random() * 9500)::numeric, 2);
        loan_rate := round((7.500 + random() * 4.000)::numeric, 3);
      else
        loan_type_value := 'student';
        loan_original_amount := round((9000 + random() * 28000)::numeric, 2);
        loan_rate := round((3.900 + random() * 2.100)::numeric, 3);
    end case;

    loan_balance := round((loan_original_amount * (0.42 + random() * 0.46))::numeric, 2);

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
      loan_type_value,
      loan_original_amount,
      loan_balance,
      loan_rate,
      current_date + (10 + floor(random() * 18)::int),
      'active',
      now()
    );
  end if;

  insert into public.notifications (id, user_id, type, message, read, created_at)
  values
    (
      gen_random_uuid(),
      new.id,
      'welcome',
      format('Welcome to NextGen Digital Banking, %s. Your accounts are ready.', base_name),
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
      format('Payroll deposit of $%s posted to %s.', payroll_amount, checking_nickname),
      false,
      now() - interval '12 days'
    ),
    (
      gen_random_uuid(),
      new.id,
      'transfer',
      format('Transfer of $%s moved into %s.', transfer_amount, savings_nickname),
      true,
      now() - interval '2 days'
    );

  insert into public.documents (
    id,
    user_id,
    document_type,
    storage_path,
    status,
    created_at
  )
  values
    (
      gen_random_uuid(),
      new.id,
      'statement',
      format('statements/%s/initial-statement.pdf', new.id),
      'available',
      now()
    ),
    (
      gen_random_uuid(),
      new.id,
      'account_summary',
      format('documents/%s/account-summary.pdf', new.id),
      'available',
      now()
    );

  if has_support_ticket then
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
      support_subject,
      (case when random() < 0.5 then 'open' else 'pending' end)::public.support_status,
      (array['low', 'medium', 'high'])[1 + floor(random() * 3)::int],
      support_message,
      now() - interval '1 day'
    );
  end if;

  insert into public.device_sessions (
    id,
    user_id,
    device_fingerprint,
    user_agent,
    ip_address,
    trusted,
    last_seen_at,
    created_at
  )
  values (
    gen_random_uuid(),
    new.id,
    md5(new.email || now()::text),
    (array[
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    ])[1 + floor(random() * 3)::int],
    null,
    false,
    now(),
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
    jsonb_build_object(
      'source', 'auth_trigger',
      'has_credit_card', has_credit_card,
      'has_loan', has_loan,
      'checking_balance', checking_balance,
      'savings_balance', savings_balance
    ),
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
      first_goal_name,
      round((200 + random() * 3500)::numeric, 2),
      round((4000 + random() * 12000)::numeric, 2),
      current_date + (90 + floor(random() * 180)::int),
      'active',
      now()
    ),
    (
      gen_random_uuid(),
      new.id,
      second_goal_name,
      round((150 + random() * 2400)::numeric, 2),
      round((2500 + random() * 9000)::numeric, 2),
      current_date + (120 + floor(random() * 240)::int),
      'active',
      now()
    );

  if has_third_goal then
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
    values (
      gen_random_uuid(),
      new.id,
      third_goal_name,
      round((100 + random() * 1800)::numeric, 2),
      round((1800 + random() * 6500)::numeric, 2),
      current_date + (150 + floor(random() * 260)::int),
      'active',
      now()
    );
  end if;

  return new;
end;
$$;
