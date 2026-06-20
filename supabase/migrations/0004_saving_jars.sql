-- =============================================================================
-- Saving Jars — category-based savings envelopes with a deposit/withdraw ledger.
-- =============================================================================

do $$ begin
  create type jar_category as enum
    ('emergency', 'travel', 'home', 'education', 'gadgets', 'vehicle', 'health', 'gifts', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type jar_movement as enum ('deposit', 'withdraw');
exception when duplicate_object then null; end $$;

-- ---------- saving_jars -----------------------------------------------------
create table if not exists public.saving_jars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category jar_category not null default 'other',
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  color text not null default '#6366f1',
  icon text not null default 'piggy-bank',
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- jar_transactions (deposit / withdraw ledger) --------------------
create table if not exists public.jar_transactions (
  id uuid primary key default uuid_generate_v4(),
  jar_id uuid not null references public.saving_jars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type jar_movement not null,
  amount numeric(14,2) not null check (amount > 0),
  note text,
  -- Link to the matching row in the main transactions ledger (set null if removed).
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_jars_user on public.saving_jars(user_id, category);
create index if not exists idx_jartx_jar on public.jar_transactions(jar_id, created_at desc);
create index if not exists idx_jartx_user on public.jar_transactions(user_id);

-- ---------- keep saving_jars.current_amount / is_completed in sync ----------
create or replace function public.apply_jar_movement()
returns trigger language plpgsql as $$
declare
  delta numeric(14,2);
begin
  if (tg_op = 'INSERT') then
    delta := case when new.type = 'deposit' then new.amount else -new.amount end;
    update public.saving_jars
       set current_amount = greatest(current_amount + delta, 0)
     where id = new.jar_id;
  elsif (tg_op = 'DELETE') then
    delta := case when old.type = 'deposit' then -old.amount else old.amount end;
    update public.saving_jars
       set current_amount = greatest(current_amount + delta, 0)
     where id = old.jar_id;
  end if;

  update public.saving_jars
     set is_completed = (current_amount >= target_amount)
   where id = coalesce(new.jar_id, old.jar_id);

  return coalesce(new, old);
end; $$;

drop trigger if exists trg_jar_movement on public.jar_transactions;
create trigger trg_jar_movement
  after insert or delete on public.jar_transactions
  for each row execute function public.apply_jar_movement();

drop trigger if exists trg_saving_jars_updated on public.saving_jars;
create trigger trg_saving_jars_updated
  before update on public.saving_jars
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ---------------------------------------------
alter table public.saving_jars      enable row level security;
alter table public.jar_transactions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['saving_jars','jar_transactions']
  loop
    execute format('drop policy if exists "%s_select" on public.%s;', t, t);
    execute format('create policy "%s_select" on public.%s for select using (auth.uid() = user_id);', t, t);
    execute format('drop policy if exists "%s_insert" on public.%s;', t, t);
    execute format('create policy "%s_insert" on public.%s for insert with check (auth.uid() = user_id);', t, t);
    execute format('drop policy if exists "%s_update" on public.%s;', t, t);
    execute format('create policy "%s_update" on public.%s for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t, t);
    execute format('drop policy if exists "%s_delete" on public.%s;', t, t);
    execute format('create policy "%s_delete" on public.%s for delete using (auth.uid() = user_id);', t, t);
  end loop;
end $$;
