# Installation & Environment

## Prerequisites
- Node.js 18.18+ (20+ recommended)
- A Supabase project (free tier is fine)
- A Google Cloud project for OAuth credentials

## Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` from the template and fill in values:
   ```bash
   cp .env.local.example .env.local
   ```
   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role (server only) |
   | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your domain in prod |
3. Apply the database migrations (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)).
4. Run the app:
   ```bash
   npm run dev
   ```

## Tests
```bash
npm test
```
