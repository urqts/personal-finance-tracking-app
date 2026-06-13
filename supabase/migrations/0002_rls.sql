-- =============================================================================
-- Row Level Security — every table is owner-scoped via auth.uid()
-- =============================================================================

alter table public.profiles          enable row level security;
alter table public.user_preferences  enable row level security;
alter table public.categories        enable row level security;
alter table public.transactions      enable row level security;
alter table public.budgets           enable row level security;
alter table public.budget_categories enable row level security;
alter table public.savings_goals     enable row level security;
alter table public.subscriptions     enable row level security;
alter table public.reports           enable row level security;
alter table public.audit_logs        enable row level security;

-- profiles: id IS the user id
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

-- Generic owner policies for the user_id tables
do $$
declare t text;
begin
  foreach t in array array[
    'user_preferences','categories','transactions','budgets',
    'budget_categories','savings_goals','subscriptions','reports','audit_logs'
  ]
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
