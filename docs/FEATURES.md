# Feature Reference

## Dashboard (`/dashboard`)
Summary cards (balance, monthly income/expenses, savings rate, budget utilisation),
income-vs-expense area chart, category pie, budget & savings progress, recent transactions.

## Transactions (`/transactions`)
- CRUD + duplicate; recurring flag (daily/weekly/monthly/yearly).
- Search, filter by type/category/date range, sortable columns, pagination.
- Bulk delete and bulk category update via row selection.
- CSV import (validation, duplicate detection, preview) and Excel export menu.

## Budgets (`/budgets`)
Monthly/yearly budgets with live spend tracking, remaining amount, progress bars and
over-budget warnings.

## Savings Goals (`/goals`)
Targets, optional target dates, progress bars, mark-as-complete.

## Subscriptions (`/subscriptions`)
Cost, billing cycle, next renewal; monthly/yearly totals and upcoming-renewal chips.

## Categories (`/categories`)
Per-user defaults (income & expense), custom categories with colour and icon pickers.

## Analytics (`/analytics`)
12-month income/expense/net trend, top spending categories, net cash flow, average
monthly spend, subscription cost, and a 0–100 financial-health score.

## Settings (`/settings`)
Profile (name) and preferences (currency, locale). Theme toggle lives in the top bar.

## Excel export (`src/lib/excel.ts`)
ExcelJS workbooks with styled header rows, native tables with filter buttons,
auto-sized columns, number formats, and multiple worksheets for the full export.

## Data & state
- `services/*` wrap Supabase queries (typed).
- `hooks/use-finance-data` loads all entities in parallel and exposes `reload()`.
- `stores/*` (Zustand) hold UI and transaction-filter state.
- `lib/analytics.ts` contains all pure computation (unit-tested).
