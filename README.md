# Strategic Minds — Enterprise Test Suite Dashboard

Universal, reusable test suite that connects to **any** Strategic Minds project.

## What it does
- Live 1–100 scoring dashboard across 19 test categories
- Click any row → enter V2 score → KPIs update instantly  
- Auto-runs measurable tests against any live URL (routes, headers, SEO titles, word count)
- Persists all scores to Supabase — survives page refreshes
- Exports JSON for Drive backup
- Connects to any project via Project ID

## Tech Stack
Next.js 15 · TypeScript · Tailwind · Supabase · Vercel

## Setup (3 minutes)

### 1. Clone
```bash
git clone https://github.com/Strategic-Minds/strategic-minds-test-suite
cd strategic-minds-test-suite
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# Fill in your Supabase keys
```

### 3. Supabase Tables (run once)
```sql
create table sm_test_scores (
  id uuid default gen_random_uuid() primary key,
  project_id text not null default 'default',
  version text not null default 'V2',
  key text not null,
  v2 integer,
  notes text,
  tester text,
  tested_at timestamptz,
  updated_at timestamptz,
  unique(project_id, version, key)
);

create table sm_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  site_url text,
  github_repo text,
  vercel_url text,
  drive_folder text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 4. Run locally
```bash
npm run dev
# → http://localhost:3000/dashboard
```

### 5. Deploy to Vercel
```bash
vercel --prod
```
Set env vars in Vercel dashboard.

## How to use for a new project
1. Open dashboard at your Vercel URL
2. Set PROJECT = any name (e.g. "nashville-epoxy-pros")
3. Set VERSION = "V2" or "V3"
4. Click rows to enter scores
5. Hit "Run Tests" to auto-check routes/headers/SEO
6. Export JSON → save to Drive

## Folder structure
```
app/
  dashboard/page.tsx    ← Main interactive dashboard
  project/page.tsx      ← Connect a new project
  api/
    scores/route.ts     ← GET/POST scores (Supabase)
    projects/route.ts   ← Project CRUD
    run-tests/route.ts  ← Auto-test any URL
lib/
  scores.ts             ← All 19 score definitions + helpers
  types.ts              ← TypeScript interfaces
  supabase.ts           ← DB client
```

---
Built by Jeremy Bensen · Strategic Minds Advisory AI · APEX AGENT
