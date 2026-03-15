# OMANYE — Auth & Role System

## Overview

OMANYE has two distinct sides:

| Side | Who | Where |
|------|-----|--------|
| **NGO Workspace** | NGO admins, staff, viewers | `/org/[slug]/dashboard` |
| **Donor Portal** | External funders | `/donor/dashboard` |

Access is enforced at **three layers**: Supabase RLS (database), API middleware, and Next.js middleware. UI adapts to what the server returns — it never makes access decisions on its own.

---

## Roles

```typescript
enum OmanyeRole {
  NGO_ADMIN   // Owns the org — manages team, billing, donor access settings
  NGO_STAFF   // Can edit programs, upload data, update indicators
  NGO_VIEWER  // Read-only inside the org (board member, auditor)
  DONOR       // External — sees only what the NGO has explicitly shared
}
```

### Role capabilities

| Action | NGO_ADMIN | NGO_STAFF | NGO_VIEWER | DONOR |
|--------|:---------:|:---------:|:----------:|:-----:|
| Read own org data | ✅ | ✅ | ✅ | ✗ |
| Create / edit programs | ✅ | ✅ | ✗ | ✗ |
| Delete programs | ✅ | ✗ | ✗ | ✗ |
| Manage org settings | ✅ | ✗ | ✗ | ✗ |
| Invite team members | ✅ | ✗ | ✗ | ✗ |
| Grant donor access | ✅ | ✗ | ✗ | ✗ |
| Review access requests | ✅ | ✗ | ✗ | ✗ |
| View accessible programs | ✗ | ✗ | ✗ | ✅ |
| Submit access requests | ✗ | ✗ | ✗ | ✅ |

---

## Donor Access Levels

When an NGO_ADMIN grants a donor access to a program, they assign one of four levels:

| Level | What the donor sees |
|-------|---------------------|
| `SUMMARY_ONLY` | Program overview, narrative updates only |
| `INDICATORS` | Summary + KPI progress and targets |
| `INDICATORS_AND_BUDGET` | Indicators + budget burn rate |
| `FULL` | Everything the NGO has not explicitly hidden |

Access can optionally:
- Be **time-limited** via `expires_at`
- Allow **report downloads** via `can_download_reports`
- Be **revoked** at any time by the NGO_ADMIN (`active = false`)

### Donor Access Request Flow

```
Donor submits request (donor_access_requests INSERT)
    ↓
NGO_ADMIN receives notification
    ↓
NGO_ADMIN approves or denies (UPDATE status, reviewed_by, reviewed_at)
    ↓
If APPROVED: NGO_ADMIN creates donor_program_access row
    ↓
Donor sees program in portal
```

---

## Database Schema

```
auth.users (Supabase managed)
    ↓ 1:1
public.profiles          — role, organization_id, onboarding_complete
    ↓ N:1
public.organizations     — name, slug, subscription_tier

public.donor_profiles    — 1:1 extension for DONOR accounts

public.programs          — belongs to organizations
public.donor_program_access  — donor ↔ program link with access_level
public.donor_access_requests — donor requests; NGO approves/denies
```

### Key constraints
- `profiles.organization_id` is **NULL** for DONOR accounts
- `donor_program_access` has a UNIQUE constraint on `(donor_id, program_id)`
- All RLS policies use `SECURITY DEFINER` helper functions to avoid per-policy joins

---

## Auth Flows

### NGO Registration (`/signup/ngo`)

1. User fills org name, country, registration number
2. User fills full name, work email, password
3. Server Action `signUpNGO()`:
   - `supabase.auth.signUp()` → creates `auth.users`
   - Admin client inserts `organizations` row (generates slug)
   - Admin client inserts `profiles` with `role = NGO_ADMIN`
4. Redirect → `/onboarding`

### Donor Registration (`/signup/donor`)

1. User fills full name, donor org name, email, password
2. Server Action `signUpDonor()`:
   - `supabase.auth.signUp()` → creates `auth.users`
   - Admin client inserts `profiles` with `role = DONOR`, `organization_id = null`
   - Admin client inserts `donor_profiles` row
3. Redirect → `/onboarding`

### Sign In (`/login`)

- Email + password via `signInWithPassword()`
- Google OAuth via `signInWithOAuth({ provider: 'google' })` → `/auth/callback`
- Post-login redirect: onboarding not complete → `/onboarding`; DONOR → `/donor/dashboard`; NGO → `/org/[slug]/dashboard`

### Onboarding

**NGO (3 steps):**
1. Org logo URL, website, description
2. Admin full name, job title, avatar URL
3. Optional: invite first team member

**Donor (2 steps):**
1. Confirm name, avatar URL, donor org name
2. Explainer: how the donor portal works

Both flows call `completeNGOOnboarding()` / `completeDonorOnboarding()` which set `onboarding_complete = true`.

---

## Route Protection (Middleware)

`src/middleware.ts` runs on every request except static assets.

| Route pattern | Requirement |
|---------------|-------------|
| `/login`, `/signup/*` | Public; authenticated users are redirected to their home |
| `/auth/callback` | Public (OAuth exchange) |
| `/onboarding` | Authenticated |
| `/org/*` | `role IN (NGO_ADMIN, NGO_STAFF, NGO_VIEWER)` |
| `/donor/*` | `role = DONOR` |

Wrong-role access → redirected to the correct home route.
Unauthenticated access → redirected to `/login?next=<path>`.

---

## Auth Hooks

All hooks are available from `@/lib/auth`:

```typescript
// Current user, profile, and organization
const { user, profile, organization, loading } = useUser()

// Role-based helpers
const { role, isNGOAdmin, isNGOStaff, isNGOViewer, isDonor, canEdit } = useRole()

// Org slug for NGO users (for building URLs)
const slug = useOrgSlug()
```

### AuthProvider

Wrap the app root with `<AuthProvider>` (done in `src/app/layout.tsx`). It:
- Fetches the initial session on mount
- Subscribes to `onAuthStateChange` for real-time session updates
- Loads `profiles` and `organizations` rows on every session change

---

## API Middleware (for future API routes)

`src/app/actions/auth.ts` pattern for server-side protection:

```typescript
// In any Server Action or Route Handler:
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'Unauthenticated' }

const { data: profile } = await supabase
  .from('profiles')
  .select('role, organization_id')
  .eq('id', user.id)
  .single()

// For NGO-only operations:
if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) {
  return { error: 'Forbidden' }
}

// For donor access check:
const { data: access } = await supabase
  .from('donor_program_access')
  .select('access_level, can_download_reports')
  .eq('donor_id', user.id)
  .eq('program_id', programId)
  .eq('active', true)
  .single()

if (!access) return { error: 'No access to this programme' }
// Use access.access_level to filter what data you return
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key — **server only, never expose** |

---

## Running the Migration

```bash
# Requires Supabase CLI
supabase db push

# Or apply manually in the Supabase SQL editor:
# Copy contents of supabase/migrations/001_auth_roles.sql
```

---

## Security Notes

- **RLS is the real gate.** Middleware and UI are convenience layers; the database enforces isolation.
- **Service role key** is used only in Server Actions (`src/app/actions/auth.ts`) and is never sent to the browser.
- **Donor access level** is enforced server-side. The frontend renders whatever the API returns — it never decides access.
- **Cross-org isolation**: no profile can read another org's data unless explicitly linked via `donor_program_access`.
- Use `supabase.auth.getUser()` (not `getSession()`) in middleware for cryptographically verified session data.
