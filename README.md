# Ziad Mohamed — Data Analyst Portfolio

React + TypeScript + Tailwind CSS v4 + Supabase. Fully dynamic content (no
code edits needed to update projects/skills/certs/experience) via a private
Admin Panel at `/admin`, deployed free on GitHub Pages.

The public site works **right now**, before Supabase is even set up — it
shows real content from `src/data/seed.ts` (sourced from your CV) as a
fallback. Once Supabase is configured, every section automatically switches
to live database data.

## 1. Local setup

```bash
npm install
npm run dev
```

Open http://localhost:5173 — the site works immediately using seed data.

## 2. Set up Supabase (for the Admin Panel + dynamic content)

1. Create a free project at https://supabase.com
2. Open **SQL Editor** -> paste the contents of `supabase/schema.sql` -> **Run**.
   This creates all tables, Row Level Security policies (public read /
   admin-only write), and a storage bucket for images.
3. Go to **Authentication -> Users -> Add user** and create the *one* admin
   account (your email + a password) — this is the only account that can log
   in at `/admin`.
4. Go to **Project Settings -> API** and copy the **Project URL** and
   **anon public key**.
5. Copy `.env.example` to `.env.local` and paste those two values in.
6. Restart `npm run dev`. Visit `/admin`, sign in, and start adding your real
   projects, certificates, skills, and experience — they'll appear on the
   public site immediately.

## 3. Deploy to GitHub Pages (free)

1. Push this repo to GitHub.
2. Repo -> **Settings -> Pages -> Source**: select **GitHub Actions**.
3. Repo -> **Settings -> Secrets and variables -> Actions**, add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Push to `main` — the included workflow (`.github/workflows/deploy.yml`)
   builds and deploys automatically. Your site will be live at
   `https://<username>.github.io/<repo-name>/`.

If your repo name isn't the root of the domain, no extra config is needed —
`vite.config.ts` already uses relative paths (`base: './'`).

## 4. Project structure

```
src/
  components/      Nav, ThemeToggle, ProjectCard, CertificateCard, Modal, DataNetworkHero
  contexts/        ThemeContext (light/dark), AuthContext (Supabase auth)
  data/            seed.ts (real fallback content), mappers.ts (DB row -> TS type)
  hooks/           useContent.ts (Supabase fetch with seed fallback)
  pages/           Home.tsx (public single-page site)
  pages/admin/     AdminLogin, AdminDashboard, ProjectsManager, ProtectedRoute
supabase/
  schema.sql       Tables + RLS policies + storage bucket, run once in Supabase
```

## 5. What's built vs. what's next

**Built:** public site (Hero, About, Skills, Projects, Certifications,
Experience, Contact) fully wired to Supabase with graceful seed fallback,
light/dark theme with persistence, responsive layout, Admin auth + protected
dashboard route, full CRUD example for Projects.

**Next phase:** CRUD editors for Skills / Certifications / Experience /
Education / Profile in the Admin Panel (same pattern as `ProjectsManager.tsx`
— copy it per section), image upload UI wired to the `portfolio-assets`
storage bucket, and CV PDF download link once a Supabase Storage file is
uploaded. Until then, add rows for those sections directly in the Supabase
Table Editor and they'll render on the public site immediately.
