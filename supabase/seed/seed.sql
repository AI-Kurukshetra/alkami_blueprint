truncate table public.audit_logs, public.fraud_events, public.device_sessions, public.support_tickets, public.documents, public.notifications, public.financial_goals, public.loans, public.cards, public.bills, public.payees, public.transfers, public.transactions, public.accounts, public.users restart identity cascade;

insert into public.users (id, email, name, role, phone, mfa_enabled)
values
  ('00000000-0000-0000-0000-000000000001', 'john_doe@nextgenbank.dev', 'John Doe', 'customer', '+1-202-555-0001', false),
  ('00000000-0000-0000-0000-000000000002', 'jane_smith@nextgenbank.dev', 'Jane Smith', 'customer', '+1-202-555-0002', false),
  ('00000000-0000-0000-0000-000000000003', 'alex_walker@nextgenbank.dev', 'Alex Walker', 'customer', '+1-202-555-0003', false),
  ('00000000-0000-0000-0000-000000000004', 'mia_chang@nextgenbank.dev', 'Mia Chang', 'customer', '+1-202-555-0004', false),
  ('00000000-0000-0000-0000-000000000005', 'ethan_brooks@nextgenbank.dev', 'Ethan Brooks', 'customer', '+1-202-555-0005', false),
  ('00000000-0000-0000-0000-000000000006', 'olivia_parker@nextgenbank.dev', 'Olivia Parker', 'customer', '+1-202-555-0006', false),
  ('00000000-0000-0000-0000-000000000007', 'noah_evans@nextgenbank.dev', 'Noah Evans', 'customer', '+1-202-555-0007', false),
  ('00000000-0000-0000-0000-000000000008', 'ava_turner@nextgenbank.dev', 'Ava Turner', 'customer', '+1-202-555-0008', false),
  ('00000000-0000-0000-0000-000000000009', 'liam_collins@nextgenbank.dev', 'Liam Collins', 'customer', '+1-202-555-0009', false),
  ('00000000-0000-0000-0000-000000000010', 'sophia_morgan@nextgenbank.dev', 'Sophia Morgan', 'customer', '+1-202-555-0010', false),
  ('00000000-0000-0000-0000-000000000011', 'isabella_hughes@nextgenbank.dev', 'Isabella Hughes', 'customer', '+1-202-555-0011', false),
  ('00000000-0000-0000-0000-000000000012', 'mason_price@nextgenbank.dev', 'Mason Price', 'customer', '+1-202-555-0012', false),
  ('00000000-0000-0000-0000-000000000013', 'amelia_ross@nextgenbank.dev', 'Amelia Ross', 'customer', '+1-202-555-0013', false),
  ('00000000-0000-0000-0000-000000000014', 'logan_cox@nextgenbank.dev', 'Logan Cox', 'customer', '+1-202-555-0014', false),
  ('00000000-0000-0000-0000-000000000015', 'charlotte_ward@nextgenbank.dev', 'Charlotte Ward', 'customer', '+1-202-555-0015', false),
  ('00000000-0000-0000-0000-000000000016', 'elijah_bennett@nextgenbank.dev', 'Elijah Bennett', 'customer', '+1-202-555-0016', false),
  ('00000000-0000-0000-0000-000000000017', 'harper_mitchell@nextgenbank.dev', 'Harper Mitchell', 'customer', '+1-202-555-0017', false),
  ('00000000-0000-0000-0000-000000000018', 'benjamin_reed@nextgenbank.dev', 'Benjamin Reed', 'customer', '+1-202-555-0018', false),
  ('00000000-0000-0000-0000-000000000019', 'evelyn_bell@nextgenbank.dev', 'Evelyn Bell', 'customer', '+1-202-555-0019', false),
  ('00000000-0000-0000-0000-000000000020', 'admin_ops@nextgenbank.dev', 'Riley Carter', 'admin', '+1-202-555-0020', true);

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
select
  gen_random_uuid(),
  u.id,
  product.account_type,
  product.nickname,
  substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
  product.balance,
  product.available_balance,
  'USD',
  'active'::public.record_status,
  product.interest_rate,
  now() - ((row_number() over (order by u.email)) || ' days')::interval
from public.users u
cross join lateral (
  values
    ('checking'::public.account_type, 'Everyday Checking', round((800 + random() * 9500)::numeric, 2), round((700 + random() * 9200)::numeric, 2), 0.010::numeric),
    ('savings'::public.account_type, 'Smart Savings', round((2500 + random() * 28000)::numeric, 2), round((2500 + random() * 28000)::numeric, 2), 3.750::numeric)
) as product(account_type, nickname, balance, available_balance, interest_rate);

insert into public.payees (id, user_id, name, category, account_reference, is_internal)
select gen_random_uuid(), u.id, payee.name, payee.category, payee.reference, false
from public.users u
cross join lateral (
  values
    ('Rent Co', 'Housing', 'RENT-4458'),
    ('City Electric', 'Utilities', 'ELEC-2010'),
    ('Metro Wireless', 'Phone', 'PHONE-5577'),
    ('Prime Credit Services', 'Credit Card', 'CARD-8891')
) as payee(name, category, reference);

insert into public.bills (id, user_id, payee_id, amount, due_date, frequency, status, autopay)
select
  gen_random_uuid(),
  p.user_id,
  p.id,
  case p.category
    when 'Housing' then round((1200 + random() * 800)::numeric, 2)
    when 'Utilities' then round((90 + random() * 110)::numeric, 2)
    when 'Phone' then round((45 + random() * 55)::numeric, 2)
    else round((110 + random() * 140)::numeric, 2)
  end,
  current_date + ((((row_number() over (partition by p.user_id order by p.name)) * 4) % 28)::integer),
  'Monthly',
  'scheduled'::public.bill_status,
  p.category <> 'Housing'
from public.payees p;

insert into public.cards (id, user_id, account_id, card_type, network, last4, status, spend_limit)
select
  gen_random_uuid(),
  a.user_id,
  a.id,
  'debit'::public.card_type,
  'Visa',
  substring(a.account_number from 7 for 4),
  'active'::public.record_status,
  2500
from public.accounts a
where a.account_type = 'checking';

insert into public.cards (id, user_id, account_id, card_type, network, last4, status, spend_limit)
select
  gen_random_uuid(),
  a.user_id,
  a.id,
  'credit'::public.card_type,
  'Mastercard',
  right(a.account_number, 4),
  'active'::public.record_status,
  6000
from (
  select
    a.*,
    row_number() over (order by u.email) as seq
  from public.accounts a
  join public.users u on u.id = a.user_id
  where a.account_type = 'checking'
) as a
where a.seq % 2 = 0;

insert into public.loans (id, user_id, loan_type, original_amount, balance, interest_rate, next_payment_date, status)
select
  gen_random_uuid(),
  u.id,
  case
    when seq.seq <= 3 then 'mortgage'::public.loan_type
    when seq.seq <= 6 then 'auto'::public.loan_type
    else 'personal'::public.loan_type
  end,
  case
    when seq.seq <= 3 then round((180000 + random() * 140000)::numeric, 2)
    when seq.seq <= 6 then round((18000 + random() * 14000)::numeric, 2)
    else round((4000 + random() * 8000)::numeric, 2)
  end,
  case
    when seq.seq <= 3 then round((120000 + random() * 110000)::numeric, 2)
    when seq.seq <= 6 then round((8000 + random() * 12000)::numeric, 2)
    else round((1500 + random() * 4000)::numeric, 2)
  end,
  case
    when seq.seq <= 3 then 5.650
    when seq.seq <= 6 then 4.750
    else 9.900
  end,
  current_date + ((seq.seq * 3)::integer),
  'active'::public.record_status
from (
  select id, row_number() over (order by email) as seq
  from public.users
  where role = 'customer'
  limit 8
) as seq
join public.users u on u.id = seq.id;

insert into public.financial_goals (id, user_id, name, current_amount, target_amount, target_date, status)
select
  gen_random_uuid(),
  u.id,
  goal.name,
  goal.current_amount,
  goal.target_amount,
  goal.target_date,
  'active'
from public.users u
cross join lateral (
  values
    ('Emergency fund', round((1000 + random() * 9000)::numeric, 2), 15000::numeric, current_date + 180),
    ('Vacation savings', round((500 + random() * 3000)::numeric, 2), 5000::numeric, current_date + 120),
    ('Car down payment', round((750 + random() * 6000)::numeric, 2), 12000::numeric, current_date + 240)
) as goal(name, current_amount, target_amount, target_date);

insert into public.notifications (id, user_id, type, message, read, created_at)
select
  gen_random_uuid(),
  u.id,
  note.type,
  note.message,
  false,
  now() - ((row_number() over (partition by u.id order by note.type)) || ' hours')::interval
from public.users u
cross join lateral (
  values
    ('payment', 'Payment received and posted to your checking account.'),
    ('bill', 'Bill paid successfully from your primary checking account.'),
    ('transfer', 'Transfer completed to Smart Savings.'),
    ('security', 'Security alert: new device sign-in requires review.')
) as note(type, message);

insert into public.support_tickets (id, user_id, subject, status, priority, latest_message, created_at)
select
  gen_random_uuid(),
  u.id,
  'Card travel notice',
  case
    when row_number() over (order by u.email) % 2 = 0 then 'pending'::public.support_status
    else 'open'::public.support_status
  end,
  'medium',
  'Travel notice has been submitted and is awaiting final confirmation.',
  now() - ((row_number() over (order by u.email)) || ' days')::interval
from (
  select
    *,
    row_number() over (order by email) as seq
  from public.users
  where role = 'customer'
) as u
where u.seq % 5 = 0;

insert into public.documents (id, user_id, document_type, storage_path, status, created_at)
select
  gen_random_uuid(),
  a.user_id,
  'statement',
  format('statements/%s/%s.pdf', a.user_id, a.id),
  'available',
  now() - (gs.seq || ' months')::interval
from public.accounts a
cross join lateral (
  values (1), (2)
) as gs(seq);

insert into public.device_sessions (id, user_id, device_fingerprint, user_agent, ip_address, trusted, last_seen_at, created_at)
select
  gen_random_uuid(),
  u.id,
  md5(u.email),
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  ('10.0.0.' || ((row_number() over (order by u.email)) + 10))::inet,
  row_number() over (order by u.email) % 2 = 0,
  now() - ((row_number() over (order by u.email)) || ' hours')::interval,
  now() - ((row_number() over (order by u.email)) || ' days')::interval
from public.users u;

insert into public.transactions (
  id,
  account_id,
  amount,
  direction,
  type,
  category,
  description,
  merchant_name,
  posted_at
)
select
  gen_random_uuid(),
  a.id,
  case
    when gs.seq % 10 = 0 then round((1800 + random() * 2200)::numeric, 2)
    when gs.seq % 8 = 0 then round((150 + random() * 350)::numeric, 2)
    when gs.seq % 7 = 0 then round((80 + random() * 160)::numeric, 2)
    else round((5 + random() * 140)::numeric, 2)
  end,
  case when gs.seq % 10 = 0 or gs.seq % 8 = 0 then 'credit'::public.transaction_direction else 'debit'::public.transaction_direction end,
  case
    when gs.seq % 10 = 0 then 'deposit'::public.transaction_type
    when gs.seq % 8 = 0 then 'refund'::public.transaction_type
    when gs.seq % 7 = 0 then 'payment'::public.transaction_type
    when gs.seq % 6 = 0 then 'fee'::public.transaction_type
    else 'purchase'::public.transaction_type
  end,
  case
    when gs.seq % 10 = 0 then 'Income'
    when gs.seq % 8 = 0 then 'Adjustments'
    when gs.seq % 7 = 0 then 'Utilities'
    when gs.seq % 5 = 0 then 'Shopping'
    when gs.seq % 3 = 0 then 'Transport'
    else 'Dining'
  end,
  case
    when gs.seq % 10 = 0 then 'Payroll deposit'
    when gs.seq % 8 = 0 then 'Merchant refund'
    when gs.seq % 7 = 0 then 'Electricity bill'
    when gs.seq % 5 = 0 then 'Amazon purchase'
    when gs.seq % 3 = 0 then 'Uber ride'
    else 'Starbucks'
  end,
  case
    when gs.seq % 10 = 0 then 'Payroll'
    when gs.seq % 8 = 0 then 'Amazon'
    when gs.seq % 7 = 0 then 'City Electric'
    when gs.seq % 5 = 0 then 'Amazon'
    when gs.seq % 3 = 0 then 'Uber'
    else 'Starbucks'
  end,
  now() - (((row_number() over (partition by a.id order by gs.seq)) * 2 + gs.seq) || ' days')::interval
from public.accounts a
cross join generate_series(1, 15) as gs(seq);

insert into public.transfers (id, user_id, from_account, to_account, amount, memo, status, created_at, completed_at)
select
  gen_random_uuid(),
  c.user_id,
  c.id,
  s.id,
  round((100 + random() * 500)::numeric, 2),
  'Monthly savings contribution',
  'completed'::public.transfer_status,
  now() - ((gs.seq * 6) || ' days')::interval,
  now() - ((gs.seq * 6) || ' days')::interval
from public.accounts c
join public.accounts s on s.user_id = c.user_id and s.account_type = 'savings'
cross join generate_series(1, 3) as gs(seq)
where c.account_type = 'checking';

insert into public.transactions (id, account_id, amount, direction, type, category, description, merchant_name, posted_at, counterparty_account_id)
select gen_random_uuid(), t.from_account, t.amount, 'debit'::public.transaction_direction, 'transfer'::public.transaction_type, 'Transfers', 'Internal transfer to savings', null, t.completed_at, t.to_account
from public.transfers t;

insert into public.transactions (id, account_id, amount, direction, type, category, description, merchant_name, posted_at, counterparty_account_id)
select gen_random_uuid(), t.to_account, t.amount, 'credit'::public.transaction_direction, 'transfer'::public.transaction_type, 'Transfers', 'Internal transfer from checking', null, t.completed_at, t.from_account
from public.transfers t;

insert into public.fraud_events (id, user_id, account_id, severity, rule_name, status, payload, detected_at)
select
  gen_random_uuid(),
  a.user_id,
  a.id,
  case
    when row_number() over (order by a.account_number) % 4 = 0 then 'high'::public.fraud_severity
    when row_number() over (order by a.account_number) % 3 = 0 then 'medium'::public.fraud_severity
    else 'low'::public.fraud_severity
  end,
  case
    when row_number() over (order by a.account_number) % 2 = 0 then 'velocity_check'
    else 'location_mismatch'
  end,
  'reviewing',
  jsonb_build_object('source', 'seed', 'notes', 'Sample fraud review event'),
  now() - ((row_number() over (order by a.account_number)) || ' hours')::interval
from public.accounts a
where a.account_type = 'checking'
limit 10;

insert into public.audit_logs (id, user_id, action, entity, entity_id, metadata, timestamp)
select
  gen_random_uuid(),
  u.id,
  action.action_name,
  action.entity_name,
  null,
  jsonb_build_object('source', 'seed'),
  now() - ((row_number() over (partition by u.id order by action.action_name)) || ' hours')::interval
from public.users u
cross join lateral (
  values
    ('login.succeeded', 'device_sessions'),
    ('transfer.created', 'transfers'),
    ('bill.scheduled', 'bills'),
    ('support.ticket_opened', 'support_tickets')
) as action(action_name, entity_name);
