# OMANYE — Production Deployment Guide

## Overview

OMANYE is a Next.js 14 application backed by Supabase (PostgreSQL + Auth + Storage)
and Stripe for billing. This guide covers everything needed to ship from a GitHub
repository to a live Vercel deployment at **https://omanye.io**.

---

## Required Environment Variables

Set all of the following in the Vercel dashboard under **Project → Settings → Environment Variables**.
Mark each as **Production**, **Preview**, and **Development** as appropriate.

| Variable | Description | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only — never expose to client) | Supabase dashboard → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe secret API key | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe dashboard → Webhooks → signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe dashboard → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_STARTER_MONTHLY` | Price ID for Starter monthly plan | Stripe dashboard → Products |
| `NEXT_PUBLIC_STRIPE_STARTER_ANNUAL` | Price ID for Starter annual plan | Stripe dashboard → Products |
| `NEXT_PUBLIC_STRIPE_PRO_MONTHLY` | Price ID for Pro monthly plan | Stripe dashboard → Products |
| `NEXT_PUBLIC_STRIPE_PRO_ANNUAL` | Price ID for Pro annual plan | Stripe dashboard → Products |
| `NEXT_PUBLIC_APP_URL` | Canonical production URL | `https://omanye.io` |

> **Security rule:** `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` must **never** be
> prefixed with `NEXT_PUBLIC_` — they are server-only and would be leaked to the browser
> if exposed.

---

## Step-by-Step Deployment

### 1. Push code to GitHub

```bash
git push origin main
```

Ensure the `main` branch is your production branch. Vercel will auto-deploy on
every push to `main`.

### 2. Connect repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js — accept defaults
4. **Do not deploy yet** — add env vars first (Step 3)

### 3. Add environment variables in Vercel dashboard

Navigate to your project → **Settings → Environment Variables** and add every
variable from the table above. Double-check that no secret key has the
`NEXT_PUBLIC_` prefix.

### 4. Configure Supabase allowed redirect URLs

In the Supabase dashboard → **Authentication → URL Configuration**:

```
Site URL:
  https://omanye.io

Additional redirect URLs:
  https://omanye.io/auth/callback
  https://*.vercel.app/auth/callback
  http://localhost:3000/auth/callback
```

### 5. Run Supabase migrations

With the Supabase CLI installed and linked to your project:

```bash
supabase db push --linked
```

This applies all migrations in `supabase/migrations/` in order:

```
001_auth_roles.sql
002_programs_indicators.sql
003_budget_finance.sql
004_donor_management.sql
005_reports.sql
006_field_data.sql
007_team.sql
008_audit_notifications.sql
010_contact_submissions.sql
010_rls_audit.sql          ← RLS hardening + performance indexes
```

Verify all policies applied:

```sql
SELECT schemaname, tablename, policyname, permissive, cmd
FROM   pg_policies
WHERE  schemaname = 'public'
ORDER  BY tablename, policyname;
```

### 6. Deploy Supabase Edge Functions

```bash
supabase functions deploy send-donor-invitation
supabase functions deploy send-team-invitation
```

Set the required secrets for each function:

```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set APP_URL=https://omanye.io
```

### 7. Configure Stripe webhook endpoint

In the Stripe dashboard → **Developers → Webhooks → Add endpoint**:

- **Endpoint URL:** `https://omanye.io/api/billing/webhook`
- **Events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.paid`

After creating the webhook, copy the **Signing secret** (`whsec_...`) and add it
to Vercel as `STRIPE_WEBHOOK_SECRET`.

### 8. Update Stripe webhook secret in Vercel

```
STRIPE_WEBHOOK_SECRET = whsec_...
```

Trigger a Vercel redeploy after adding this variable so it takes effect.

### 9. Switch Stripe from test mode to live mode

1. In the Stripe dashboard, toggle **Test mode → Live mode**
2. Copy the live keys (publishable + secret)
3. Update Vercel env vars:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → live `pk_live_...`
   - `STRIPE_SECRET_KEY` → live `sk_live_...`
4. Recreate the webhook endpoint in live mode (step 7 above)
5. Update all `NEXT_PUBLIC_STRIPE_*` price IDs with live price IDs

### 10. Test production signup flow end-to-end

1. Visit `https://omanye.io/signup/ngo` and create a new NGO account
2. Check email for verification link
3. Complete onboarding
4. Visit `https://omanye.io/signup/donor` and create a donor account
5. Test invitation flow: invite donor to a program from NGO dashboard
6. Verify donor can see program data at the correct access level

---

## Vercel Region

The `vercel.json` specifies `"regions": ["iad1"]` (US East — Northern Virginia).
Change to the region closest to your primary user base:

| Region code | Location |
|---|---|
| `iad1` | US East (N. Virginia) — default |
| `sfo1` | US West (San Francisco) |
| `lhr1` | Europe (London) |
| `fra1` | Europe (Frankfurt) |
| `sin1` | Asia-Pacific (Singapore) |
| `cpt1` | Africa (Cape Town) |

---

## Supabase Storage Buckets

Ensure these buckets exist and have the correct policies:

| Bucket | Access | Purpose |
|---|---|---|
| `avatars` | Private (signed URLs) | User profile photos |
| `org-logos` | Private (signed URLs) | Organization logos |
| `program-covers` | Private (signed URLs) | Program cover images |
| `report-attachments` | Private (signed URLs) | Report file attachments |
| `field-attachments` | Private (signed URLs) | Field submission files |

Create any missing buckets in Supabase dashboard → **Storage → New bucket**.
Set each bucket to **private**; the app generates short-lived signed URLs at
request time.

---

## Supabase Backups

Enable **Point-in-Time Recovery (PITR)** in Supabase dashboard → **Database → Backups**.
PITR is available on Pro plan and above. For Free/Starter, enable daily backups.

---

## DNS Configuration

| Record | Type | Value |
|---|---|---|
| `omanye.io` | A | Vercel IP (from Vercel domains dashboard) |
| `www.omanye.io` | CNAME | `cname.vercel-dns.com` |

Add both `omanye.io` and `www.omanye.io` in Vercel → **Project → Domains**.

---

## Monitoring

- **Vercel Analytics:** enable in Vercel dashboard → **Analytics** tab
- **Vercel Speed Insights:** add `@vercel/speed-insights` package when ready
- **Sentry (recommended):** replace `console.error` in `src/app/error.tsx` with
  `Sentry.captureException(error)` and configure `SENTRY_DSN` env var

---

## Rolling Back

To roll back to a previous deployment:

```bash
# Via Vercel CLI
vercel rollback [deployment-url]
```

Or use the Vercel dashboard → **Deployments** → click the deployment → **Promote to Production**.

Database migrations are not automatically reversed on rollback. To reverse a
migration, apply the rollback SQL documented at the bottom of each migration file.
