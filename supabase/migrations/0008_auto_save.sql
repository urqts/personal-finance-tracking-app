-- =============================================================================
-- Auto-Save to Jar: at month end, move the remaining balance (income - expenses)
-- of the just-ended month into a chosen jar — 100%, a percentage, or a fixed amount.
-- =============================================================================

create table if not exists public.auto_save_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_enabled boolean not null default false,
  jar_id uuid references public.saving_jars(id) on delete set null,
  mode text not null default 'full' check (mode in ('full', 'percentage', 'fixed')),
  percentage numeric(5,2) not null default 100 check (percentage >= 0 and percentage <= 100),
  fixed_amount numeric(14,2) not null default 0 check (fixed_amount >= 0),
  last_run_month date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_auto_save_updated on public.auto_save_settings;
create trigger trg_auto_save_updated
  before update on public.auto_save_settings
  for each row execute function public.set_updated_at();

alter table public.auto_save_settings enable row level security;
do $$ begin
  drop policy if exists "auto_save_select" on public.auto_save_settings;
  create policy "auto_save_select" on public.auto_save_settings for select using (auth.uid() = user_id);
  drop policy if exists "auto_save_insert" on public.auto_save_settings;
  create policy "auto_save_insert" on public.auto_save_settings for insert with check (auth.uid() = user_id);
  drop policy if exists "auto_save_update" on public.auto_save_settings;
  create policy "auto_save_update" on public.auto_save_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  drop policy if exists "auto_save_delete" on public.auto_save_settings;
  create policy "auto_save_delete" on public.auto_save_settings for delete using (auth.uid() = user_id);
end $$;
