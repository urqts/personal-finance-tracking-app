# Fintrack — Personal Finance Tracker

A production-ready personal finance management platform. Track income and expenses,
manage budgets, set savings goals, monitor subscriptions, analyse trends, and export
everything to Excel — in a clean, minimalist, fintech-inspired UI with dark mode.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase
(PostgreSQL + Auth) · Zustand · Recharts · ExcelJS · Zod · React Hook Form**.

> Note: this project ships against the versions installed by `create-next-app`
> (Next.js 16, React 19, Tailwind v4). The architecture matches the original
> Next.js 15 spec — App Router, RSC, Server Actions-friendly data layer.

## Features

- **Auth** — Google OAuth via Supabase, protected routes, session persistence, profile page.
- **Dashboard** — balance, monthly income/expenses, savings rate, budget utilisation, income-vs-expense trend, category breakdown, budget & savings progress, recent activity.
- **Transactions** — create / edit / delete / duplicate, search, filter (date, category, type, amount, tags), sort, pagination, bulk delete & bulk category update.
- **Recurring** — daily / weekly / monthly / yearly flags with an occurrence generator (`src/lib/recurring.ts`).
- **Categories** — defaults seeded per user, custom categories with colours and icons.
- **Budgets** — monthly/yearly budgets with progress, remaining, and over-budget warnings.
- **Savings goals** — targets, dates, progress bars, completion.
- **Subscriptions** — Netflix/Spotify/custom, billing cycles, renewal reminders, monthly/yearly totals.
- **Analytics** — 12-month trends, top categories, net cash flow, average spending, financial-health score.
- **Excel export** — transactions, budgets, goals, subscriptions, analytics, or full export with formatted tables, filters and auto-sized columns (ExcelJS).
- **Import** — CSV import with field mapping, validation, duplicate detection and a preview.
- **Theming** — light/dark/system with persistence; fully responsive with a mobile drawer nav.
- **Security** — Supabase Row Level Security on every table, Zod validation, middleware route guards.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

## Documentation

- [Installation & environment](docs/INSTALLATION.md)
- [Supabase & Google OAuth setup](docs/SUPABASE_SETUP.md)
- [Database schema & diagram](docs/DATABASE.md)
- [Deployment to Vercel](docs/DEPLOYMENT.md)
- [Feature reference](docs/FEATURES.md)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | Lint |
| `npm test` | Run unit tests (Vitest) |

## Project structure

```
src/
  app/
    (dashboard)/            # protected route group: dashboard, transactions, budgets,
                            # goals, subscriptions, categories, analytics, settings
    auth/                   # OAuth callback + signout route handlers
    api/health/             # health check
    login/                  # Google sign-in
  components/
    ui/                     # shadcn/ui primitives
    layout/                 # sidebar, topbar, mobile nav, theme toggle, user menu
    dashboard/ transactions/ ...   # feature components
    shared/                 # icon, page header, empty state
  hooks/                    # useUser, usePreferences, useFinanceData
  lib/                      # supabase clients, analytics, excel, import, recurring,
                            # validations (zod), constants, format, utils
  services/                 # data access (transactions, categories, budgets, …)
  stores/                   # Zustand stores (ui, filters)
  types/                    # database + domain types
supabase/
  migrations/               # 0001 schema · 0002 RLS · 0003 new-user bootstrap
  seed.sql                  # sample data
tests/                      # Vitest unit tests
```

## License

MIT
