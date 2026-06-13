# Supabase & Google OAuth Setup

## 1. Create the database schema
In the Supabase Dashboard → **SQL Editor**, run the migrations in order:
1. `supabase/migrations/0001_init.sql` — tables, enums, indexes, triggers
2. `supabase/migrations/0002_rls.sql` — Row Level Security policies
3. `supabase/migrations/0003_bootstrap.sql` — auto-creates a profile, preferences and default categories on sign-up

Or with the Supabase CLI:
```bash
supabase db push        # if using migrations directory
# or
supabase db execute --file supabase/migrations/0001_init.sql
```

## 2. Enable Google OAuth
1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID* (Web application).
2. Authorised redirect URI:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Copy the **Client ID** and **Client Secret**.
4. **Supabase Dashboard** → Authentication → Providers → **Google** → paste the Client ID/Secret → enable.
5. **Supabase Dashboard** → Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (and your production URL)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`

## 3. Seed sample data (optional)
```bash
# Replace the UUID with a real auth.users id (sign in once first)
psql "$DATABASE_URL" -v user_id="'00000000-0000-0000-0000-000000000000'" -f supabase/seed.sql
```

## Row Level Security
Every table is protected so users can only read/write their own rows via `auth.uid() = user_id`
(`profiles` uses `auth.uid() = id`). Policies are defined in `0002_rls.sql`.
