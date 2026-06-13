# Database Schema

PostgreSQL (Supabase). All tables are owner-scoped via Row Level Security.

## Tables
- **profiles** — 1:1 with `auth.users` (id, email, full_name, avatar_url).
- **user_preferences** — currency, locale, theme, week_start, income target.
- **categories** — name, type (income/expense), color, icon, is_default.
- **transactions** — title, description, notes, amount, type, tags[], occurred_on,
  is_recurring, recurrence, recurrence_end, parent_id (→ transactions), category_id.
- **budgets** — name, period (monthly/yearly), amount, start_date, is_active.
- **budget_categories** — per-category allocation within a budget (budget_id, category_id, amount).
- **savings_goals** — name, target_amount, current_amount, target_date, is_completed.
- **subscriptions** — name, cost, billing_cycle, next_renewal, is_active, category_id.
- **reports** — saved report metadata (kind, params jsonb).
- **audit_logs** — action, entity, entity_id, metadata jsonb.

## Relationships (ERD)
```
auth.users 1──1 profiles
auth.users 1──1 user_preferences
auth.users 1──* categories
auth.users 1──* transactions ───* category (set null on delete)
transactions 1──* transactions (parent_id, recurring occurrences)
auth.users 1──* budgets 1──* budget_categories ──* categories
auth.users 1──* savings_goals
auth.users 1──* subscriptions ───* category (set null)
auth.users 1──* reports
auth.users 1──* audit_logs
```

## Indexes
Composite indexes on `(user_id, occurred_on)`, `(user_id, type)`, category FK, a partial
index on recurring transactions, and a GIN index on `tags`. See `0001_init.sql`.

## Triggers
- `set_updated_at` keeps `updated_at` current on update.
- `handle_new_user` (on `auth.users` insert) bootstraps profile, preferences and the
  default income/expense categories.
