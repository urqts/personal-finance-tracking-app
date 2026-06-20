-- =============================================================================
-- Mark transactions that are transfers (e.g. moving money into/out of a saving
-- jar). Transfers are recorded for history but excluded from spending/income
-- analytics, savings rate, budgets and category breakdowns.
-- =============================================================================

alter table public.transactions
  add column if not exists is_transfer boolean not null default false;

create index if not exists idx_tx_transfer on public.transactions(user_id, is_transfer);
