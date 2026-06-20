-- =============================================================================
-- Dedicated category system for Saving Jars, fully separate from transaction
-- categories. Jars reference jar_categories only.
-- =============================================================================

create table if not exists public.jar_categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  icon text not null default 'piggy-bank',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_jarcat_user on public.jar_categories(user_id);

drop trigger if exists trg_jar_categories_updated on public.jar_categories;
create trigger trg_jar_categories_updated
  before update on public.jar_categories
  for each row execute function public.set_updated_at();

-- RLS
alter table public.jar_categories enable row level security;
do $$ begin
  drop policy if exists "jar_categories_select" on public.jar_categories;
  create policy "jar_categories_select" on public.jar_categories for select using (auth.uid() = user_id);
  drop policy if exists "jar_categories_insert" on public.jar_categories;
  create policy "jar_categories_insert" on public.jar_categories for insert with check (auth.uid() = user_id);
  drop policy if exists "jar_categories_update" on public.jar_categories;
  create policy "jar_categories_update" on public.jar_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  drop policy if exists "jar_categories_delete" on public.jar_categories;
  create policy "jar_categories_delete" on public.jar_categories for delete using (auth.uid() = user_id);
end $$;

-- Repoint saving_jars.category_id from transaction categories -> jar_categories.
-- Existing values referenced transaction categories, so clear them first.
update public.saving_jars set category_id = null;
alter table public.saving_jars drop constraint if exists saving_jars_category_id_fkey;
alter table public.saving_jars
  add constraint saving_jars_category_id_fkey
  foreign key (category_id) references public.jar_categories(id) on delete set null;

-- Seed default jar categories for all existing users.
insert into public.jar_categories (user_id, name, color, icon, is_default)
select p.id, d.name, d.color, d.icon, true
from public.profiles p
cross join (values
  ('Emergency', '#ef4444', 'shield'),
  ('Travel',    '#0ea5e9', 'plane'),
  ('Home',      '#f97316', 'home'),
  ('Education', '#6366f1', 'graduation-cap'),
  ('Gadgets',   '#8b5cf6', 'smartphone'),
  ('Vehicle',   '#14b8a6', 'car'),
  ('Health',    '#06b6d4', 'heart-pulse'),
  ('Gifts',     '#ec4899', 'gift'),
  ('Other',     '#64748b', 'piggy-bank')
) as d(name, color, icon)
on conflict (user_id, name) do nothing;

-- New-user bootstrap: also create default jar categories.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.categories (user_id, name, type, color, icon, is_default) values
    (new.id, 'Salary','income','#22c55e','wallet',true),
    (new.id, 'Freelance','income','#10b981','briefcase',true),
    (new.id, 'Investments','income','#14b8a6','trending-up',true),
    (new.id, 'Gifts','income','#84cc16','gift',true),
    (new.id, 'Other','income','#a3e635','circle',true),
    (new.id, 'Food','expense','#f97316','utensils',true),
    (new.id, 'Transportation','expense','#3b82f6','car',true),
    (new.id, 'Shopping','expense','#ec4899','shopping-bag',true),
    (new.id, 'Bills','expense','#ef4444','receipt',true),
    (new.id, 'Entertainment','expense','#8b5cf6','clapperboard',true),
    (new.id, 'Healthcare','expense','#06b6d4','heart-pulse',true),
    (new.id, 'Education','expense','#6366f1','graduation-cap',true),
    (new.id, 'Travel','expense','#0ea5e9','plane',true),
    (new.id, 'Subscriptions','expense','#f43f5e','credit-card',true),
    (new.id, 'Other','expense','#64748b','circle',true)
  on conflict do nothing;

  insert into public.jar_categories (user_id, name, color, icon, is_default) values
    (new.id, 'Emergency','#ef4444','shield',true),
    (new.id, 'Travel','#0ea5e9','plane',true),
    (new.id, 'Home','#f97316','home',true),
    (new.id, 'Education','#6366f1','graduation-cap',true),
    (new.id, 'Gadgets','#8b5cf6','smartphone',true),
    (new.id, 'Vehicle','#14b8a6','car',true),
    (new.id, 'Health','#06b6d4','heart-pulse',true),
    (new.id, 'Gifts','#ec4899','gift',true),
    (new.id, 'Other','#64748b','piggy-bank',true)
  on conflict do nothing;

  return new;
end; $$;
