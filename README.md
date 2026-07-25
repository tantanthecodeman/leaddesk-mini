# LeadDesk Mini

A small lead-capture product: a public landing page that takes a name/email/budget/message submission, and a password-protected admin panel to review, search, and triage those leads.

**Live app:** `https://leaddesk-mini-orpin.vercel.app/`

**Admin panel:** `https://leaddesk-mini-orpin.vercel.app/admin/login`

**Test credentials:** `test@gmail.com` / `bot@123`

---

## Why this stack

I built this on **Next.js 15 (App Router) + TypeScript, Supabase (Postgres + Auth), Tailwind, and Zod**, deployed on Vercel. A few of these choices are worth explaining rather than just listing:

**One Next.js app instead of a separate frontend + backend.** For a product this size, running a standalone Express server alongside the frontend would mean two deployments, two sets of environment variables, and CORS configuration for no real benefit. Route Handlers under `app/api/` give me the same REST semantics with one deploy target.

**Supabase over a self-hosted database.** I wanted a real relational database (so the data model actually says something — foreign keys, constraints, not just a JSON blob) without spending part of my time window provisioning and securing a Postgres instance. Supabase also gave me Auth for free, which mattered once Task B needed real sessions rather than a hand-rolled login.

**Zod schema shared between client and server.** The validation rules for a lead (name length, valid email, message length) are defined exactly once in `lib/validation.ts` and imported by both the form component and the API route. I didn't want two versions of "what makes a lead valid" to drift apart from each other.

**Row Level Security in Postgres, on top of route-level checks.** This was a deliberate redundancy, not an oversight. Even if there were a bug in my API route's auth check, the database itself refuses to hand back lead data to anyone who isn't authenticated. I'd rather over-explain this in an interview than have it be a silent gap.

---

## Data model

One table: `leads`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. UUID instead of a serial integer so lead IDs aren't sequentially guessable — someone can't scrape `/api/leads/1`, `/2`, `/3`. |
| `name` | `text` | Required. |
| `email` | `text` | Required. Validated at the application layer (Zod), not with a DB-level format constraint — easier to evolve validation rules without a migration. |
| `budget_range` | `text` | One of `<1k`, `1k-5k`, `5k-20k`, `20k+`. Stored as text rather than a Postgres `enum` type for the same reason — adding a new range later is a one-line Zod change, not a schema migration. |
| `message` | `text` | Required, minimum 10 characters. |
| `status` | `text` | One of `New`, `Contacted`, `Closed`, enforced with a `check` constraint. Defaults to `New` on insert. |
| `created_at` | `timestamptz` | Defaults to `now()`. |

**Row Level Security policies:**

- Anonymous (`anon`) users can `INSERT` only — this is how the public form works without any login, and it's *all* they can do. They cannot read or modify existing leads.
- Authenticated users can `SELECT` and `UPDATE` — this is the admin panel's access.

I considered normalizing `budget_range` into its own lookup table but decided against it — at this scale a `check` constraint gives the same data integrity guarantee with far less complexity, and I'd rather defend a simple decision than have unused complexity in the schema.

Full schema: [`supabase/schema.sql`](./supabase/schema.sql).

---

## Auth approach

Admin access uses **Supabase Auth** (email + password) with session state held in HTTP-only cookies — not a hardcoded password check, and not client-side-only auth.

There are three enforcement layers, each independent of the others:

1. **Middleware** (`middleware.ts` / `lib/supabase/middleware.ts`) runs on every request to `/admin/*` before any page renders. No valid session → redirect to `/admin/login`. Already logged in and hitting `/admin/login` → redirect forward to `/admin`. This also refreshes the session cookie on each request so it doesn't expire mid-use.
2. **API route checks** — every route under `/api/leads` that reads or mutates data calls `supabase.auth.getUser()` and returns `401` if there's no session, independent of whatever the middleware already did.
3. **Row Level Security** at the database level, described above — the last line of defense if the first two were ever bypassed.

The reason for three layers instead of one: middleware protects *pages*, API checks protect *data mutations reachable by direct request* (e.g. someone hitting the API with curl, bypassing the UI entirely), and RLS protects the *data itself* regardless of how it's reached. Each layer assumes the one before it might fail.

Session tokens are managed entirely by Supabase's SSR helpers (`@supabase/ssr`) — I'm not manually issuing or verifying JWTs, which would be needless reinvention for a task like this, but I can walk through what those cookies contain and how `getUser()` validates them server-side if that's useful in conversation.

---

## Project structure

```
leaddesk-mini/
├── app/
│   ├── page.tsx                 # Public landing page + lead form
│   ├── admin/
│   │   ├── page.tsx              # Admin dashboard (server-rendered leads table)
│   │   ├── login/page.tsx        # Login form
│   │   └── layout.tsx            # Admin shell — shows logged-in email + sign out
│   └── api/leads/
│       ├── route.ts               # POST (create lead), GET (list, admin-only)
│       └── [id]/route.ts          # PATCH (status update, admin-only)
├── components/
│   ├── LeadForm.tsx                # Public form, client + server validated
│   ├── LeadsTable.tsx               # Admin table — search + optimistic status toggle
│   └── LogoutButton.tsx
├── lib/
│   ├── supabase/{client,server,middleware}.ts   # Browser / server / edge Supabase clients
│   └── validation.ts                             # Shared Zod schemas
├── middleware.ts                    # Route-level auth gate for /admin/*
└── supabase/schema.sql               # Table + RLS policies
```

---

## Assumptions made

The brief was intentionally light on some specifics, so I made these calls:

- **Budget ranges are fixed to four buckets** rather than a free-text field — makes the data usable for the admin (filterable/sortable in principle) rather than a pile of inconsistent strings.
- **Search covers name and email only**, not the message body — the message field is meant to be read in context per-lead, not searched as a keyword index; a full-text search felt like over-engineering for this scope.
- **Status changes cycle through a fixed order** (New → Contacted → Closed → New) via a single click, rather than a dropdown — faster for a single admin user triaging a small list, though a dropdown would scale better with more statuses.
- **No email notification on new lead submission** — out of scope per the brief; noted here as something I'd add for a real client rather than something I forgot.

---

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

Requires a Supabase project with `supabase/schema.sql` applied and at least one user created in Authentication → Users (for admin login).

---

## What I'd do with more time

- Rate limiting on the public POST endpoint (currently unrestricted — fine for a demo, not for production).
- Pagination on the admin table (currently loads all leads at once).
- Email format validation at the database level too, not just application-level, as defense-in-depth consistent with how I treated auth.