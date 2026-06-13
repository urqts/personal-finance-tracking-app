-- =============================================================================
-- New-user bootstrap: create profile, preferences and default categories
-- when a row is added to auth.users (Google OAuth sign-up).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  -- Default income categories
  insert into public.categories (user_id, name, type, color, icon, is_default) values
    (new.id, 'Salary',      'income', '#22c55e', 'wallet',     true),
    (new.id, 'Freelance',   'income', '#10b981', 'briefcase',  true),
    (new.id, 'Investments', 'income', '#14b8a6', 'trending-up',true),
    (new.id, 'Gifts',       'income', '#84cc16', 'gift',       true),
    (new.id, 'Other',       'income', '#a3e635', 'circle',     true)
  on conflict do nothing;

  -- Default expense categories
  insert into public.categories (user_id, name, type, color, icon, is_default) values
    (new.id, 'Food',           'expense', '#f97316', 'utensils',     true),
    (new.id, 'Transportation', 'expense', '#3b82f6', 'car',          true),
    (new.id, 'Shopping',       'expense', '#ec4899', 'shopping-bag',  true),
    (new.id, 'Bills',          'expense', '#ef4444', 'receipt',       true),
    (new.id, 'Entertainment',  'expense', '#8b5cf6', 'clapperboard',  true),
    (new.id, 'Healthcare',     'expense', '#06b6d4', 'heart-pulse',   true),
    (new.id, 'Education',      'expense', '#6366f1', 'graduation-cap',true),
    (new.id, 'Travel',         'expense', '#0ea5e9', 'plane',         true),
    (new.id, 'Subscriptions',  'expense', '#f43f5e', 'credit-card',   true),
    (new.id, 'Other',          'expense', '#64748b', 'circle',        true)
  on conflict do nothing;

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
