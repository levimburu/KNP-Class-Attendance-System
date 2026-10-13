# KNP Academic Attendance Management & Analytics System

A role-based web application for Kitale National Polytechnic: departments,
programmes, intakes, class groups, students, units, lecturers, teaching
assignments, sessions, attendance and analytics — built on a normalized
Postgres schema with Row-Level Security.

**Stack:** React + TypeScript + Vite + Tailwind CSS + Supabase (Postgres + Auth) + Recharts.

---

## What is built so far (Phase 1 — Foundation)

- **Database:** full relational schema, constraints, indexes (`supabase/migrations/0001_schema.sql`)
- **Security:** Row-Level Security — 29 policies for admin / HOD (department-scoped) / lecturer (own teaching) / management (`0002_rls.sql`)
- **Seed:** clearly-labelled demo data (`0003_seed.sql`)
- **App shell:** maroon KNP design system, responsive sidebar + topbar, auth, protected routes
- **Working pages:** Overview dashboard (live KPIs + charts), Students (searchable list), Departments (list + create)
- Remaining modules are routed with placeholders; the data model + security for them already exist.

Build is verified: `npm run build` compiles with no type errors.

---

## 1. Create a Supabase project

1. Go to supabase.com → **New project** (free tier is fine).
2. Once ready, open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_seed.sql` (optional demo data)
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.

## 2. Configure the app

```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:
```bash
npm run build      # outputs dist/
npm run preview
```

## 4. Create your admin account

1. There is no public sign-up screen; create the first user in Supabase:
   **Authentication → Users → Add user** (set an email + password).
   A matching row is created in `profiles` automatically.
2. Make that user an admin (SQL Editor):
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Sign in at `/login`.

Roles: `admin`, `hod` (set `department_id` on their profile), `lecturer`
(link `lecturer_id`), `management` (read-all), `student`.

---

## Deploy

Deploy the built app to Vercel or Netlify (set the two `VITE_` env vars in the
host's project settings). Supabase is the backend — nothing else to host.

## Analytics definitions

- **Attendance rate** = present outcomes ÷ recorded outcomes × 100.
- Missing attendance submissions are **not** counted as absences.
- Cancelled sessions are excluded.

## Roadmap (next phases)

- Attendance Records page (server-side filter/paginate/export)
- Programmes, Intakes & Class Groups, Units, Lecturers, Teaching Assignments CRUD
- Timetable & Sessions (calendar + list, conflict warnings)
- Analytics workspace with drill-down + PDF/Excel export
- CSV/Google-Sheets import workflow (map the existing attendance sheet)
- Audit log viewer, User Management, Settings
