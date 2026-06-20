-- =============================================================================
-- Saving Jars now reference the user's existing categories instead of a
-- separate built-in jar_category enum.
-- =============================================================================

-- Add the FK to categories
alter table public.saving_jars
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Drop the old enum-based category column (index on it is removed automatically)
alter table public.saving_jars drop column if exists category;

-- Helpful index for category-based summaries
create index if not exists idx_jars_category on public.saving_jars(user_id, category_id);

-- Remove the now-unused enum type (safe: nothing else references it)
drop type if exists jar_category;
