-- =============================================================================
-- Seed data for local development.
-- Replace :user_id with an existing auth.users id, e.g.:
--   psql ... -v user_id="'00000000-0000-0000-0000-000000000000'" -f supabase/seed.sql
-- Categories & preferences are created automatically by the new-user trigger.
-- =============================================================================

\set uid :user_id

-- Sample transactions (last ~3 months)
insert into public.transactions (user_id, category_id, title, amount, type, tags, occurred_on, description)
select
  :uid,
  (select id from public.categories where user_id = :uid and name = c.name and type = c.type limit 1),
  c.title, c.amount, c.type, c.tags, c.occurred_on, c.descr
from (values
  ('Monthly Salary',    'Salary',         'income',  5200.00, array['work'],          (current_date - 5),  'June paycheck'),
  ('Side Project',      'Freelance',      'income',   850.00, array['side-hustle'],   (current_date - 12), 'Logo design'),
  ('Dividends',         'Investments',    'income',   120.50, array['passive'],       (current_date - 20), 'ETF dividend'),
  ('Grocery Run',       'Food',           'expense',  142.30, array['groceries'],     (current_date - 2),  'Weekly groceries'),
  ('Dinner Out',        'Food',           'expense',   64.00, array['dining'],        (current_date - 4),  NULL),
  ('Gas',               'Transportation', 'expense',   58.20, array['car'],           (current_date - 6),  NULL),
  ('New Shoes',         'Shopping',       'expense',   89.99, array['clothing'],      (current_date - 8),  NULL),
  ('Electric Bill',     'Bills',          'expense',  110.00, array['utilities'],     (current_date - 10), 'June electricity'),
  ('Movie Night',       'Entertainment',  'expense',   32.00, array['fun'],           (current_date - 14), NULL),
  ('Pharmacy',          'Healthcare',     'expense',   24.75, array['health'],        (current_date - 18), NULL),
  ('Online Course',     'Education',      'expense',   49.00, array['learning'],      (current_date - 25), 'TypeScript course'),
  ('Last Month Salary', 'Salary',         'income',  5200.00, array['work'],          (current_date - 35), NULL),
  ('Restaurant',        'Food',           'expense',   78.40, array['dining'],        (current_date - 33), NULL),
  ('Train Pass',        'Transportation', 'expense',   95.00, array['commute'],       (current_date - 40), NULL)
) as c(title, name, type, amount, tags, occurred_on, descr);

-- Sample budget
insert into public.budgets (user_id, name, period, amount)
values (:uid, 'Monthly Essentials', 'monthly', 1500.00);

-- Sample savings goals
insert into public.savings_goals (user_id, name, target_amount, current_amount, target_date)
values
  (:uid, 'Emergency Fund', 10000.00, 4200.00, (current_date + interval '8 months')::date),
  (:uid, 'Vacation 2026',   3000.00,  950.00, (current_date + interval '5 months')::date);

-- Sample subscriptions
insert into public.subscriptions (user_id, name, cost, billing_cycle, next_renewal)
values
  (:uid, 'Netflix',         15.49, 'monthly', (current_date + 12)),
  (:uid, 'Spotify',         10.99, 'monthly', (current_date + 4)),
  (:uid, 'YouTube Premium', 13.99, 'monthly', (current_date + 22));
