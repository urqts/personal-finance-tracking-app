-- =============================================================================
-- Personal Finance Tracker — Schema
-- PostgreSQL (Supabase). Run in the Supabase SQL editor or via the CLI.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- Enums -----------------------------------------------------------
do $$ begin
  create type transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recurrence_interval as enum ('none', 'daily', 'weekly', 'monthly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_cycle as enum ('weekly', 'monthly', 'quarterly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type budget_period as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

-- ---------- profiles (1:1 with auth.users) ----------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- user_preferences ------------------------------------------------
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  locale text not null default 'en-US',
  theme text not null default 'system' check (theme in ('light','dark','system')),
  week_start smallint not null default 0 check (week_start between 0 and 6),
  monthly_income_target numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- categories ------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type transaction_type not null,
  color text not null default '#6366f1',
  icon text not null default 'circle',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type)
);

-- ---------- transactions ----------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  description text,
  notes text,
  amount numeric(14,2) not null check (amount >= 0),
  type transaction_type not null,
  tags text[] not null default '{}',
  occurred_on date not null default current_date,
  is_recurring boolean not null default false,
  recurrence recurrence_interval not null default 'none',
  recurrence_end date,
  parent_id uuid references public.transactions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- budgets ---------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  period budget_period not null default 'monthly',
  amount numeric(14,2) not null check (amount >= 0),
  start_date date not null default date_trunc('month', current_date)::date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- budget_categories (per-category allocation within a budget) ------
create table if not exists public.budget_categories (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (budget_id, category_id)
);

-- ---------- savings_goals ---------------------------------------------------
create table if not exists public.savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_date date,
  color text not null default '#10b981',
  icon text not null default 'target',
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- subscriptions ---------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  cost numeric(14,2) not null check (cost >= 0),
  billing_cycle billing_cycle not null default 'monthly',
  next_renewal date not null,
  is_active boolean not null default true,
  color text not null default '#ef4444',
  icon text not null default 'credit-card',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- reports (saved/generated report metadata) -----------------------
create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null,
  params jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- audit_logs ------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Indexes ---------------------------------------------------------
create index if not exists idx_tx_user_date on public.transactions(user_id, occurred_on desc);
create index if not exists idx_tx_user_type on public.transactions(user_id, type);
create index if not exists idx_tx_category on public.transactions(category_id);
create index if not exists idx_tx_recurring on public.transactions(user_id, is_recurring) where is_recurring = true;
create index if not exists idx_tx_tags on public.transactions using gin (tags);
create index if not exists idx_cat_user on public.categories(user_id, type);
create index if not exists idx_budget_user on public.budgets(user_id, is_active);
create index if not exists idx_budgetcat_budget on public.budget_categories(budget_id);
create index if not exists idx_goals_user on public.savings_goals(user_id, is_completed);
create index if not exists idx_subs_user on public.subscriptions(user_id, is_active);
create index if not exists idx_subs_renewal on public.subscriptions(user_id, next_renewal);
create index if not exists idx_audit_user on public.audit_logs(user_id, created_at desc);

-- ---------- updated_at trigger ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','user_preferences','categories','transactions','budgets','savings_goals','subscriptions']
  loop
    execute format('drop trigger if exists trg_%s_updated on public.%s;', t, t);
    execute format('create trigger trg_%s_updated before update on public.%s for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;
