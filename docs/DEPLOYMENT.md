# Deployment (Vercel)

1. Push the repo to GitHub/GitLab/Bitbucket.
2. In **Vercel** → *New Project* → import the repo (framework auto-detected as Next.js).
3. Add environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = your production URL (e.g. `https://app.example.com`)
4. Update Supabase Auth **URL Configuration** to include the production Site URL and
   `https://app.example.com/auth/callback`.
5. Update the Google OAuth client's authorised redirect URI to the Supabase callback.
6. Deploy. Vercel builds with `next build` (see `vercel.json`).

## Notes
- `middleware.ts` refreshes sessions on every request and guards protected routes.
- The service-role key is never exposed to the browser; keep it server-only.
