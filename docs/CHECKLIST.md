# OMANYE — Pre-Launch Checklist

Work through every item before going live. Check each box once confirmed.

---

## Security

- [ ] All RLS policies verified — run the verification query in `010_rls_audit.sql`
- [ ] Restrictive policy on `expenditures` confirmed (no donor row reads)
- [ ] Restrictive policy on `donor_program_access` hides `internal_notes` from DONOR role
- [ ] `audit_log` INSERT/UPDATE/DELETE revoked from `authenticated` role
- [ ] `field_submissions` confirmed inaccessible to donors
- [ ] Cross-org profile leak test passes (org A user cannot query org B profiles)
- [ ] No secret keys (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`) prefixed with `NEXT_PUBLIC_`
- [ ] No secrets committed to git (check with `git log -p | grep -i secret`)
- [ ] Stripe webhook signature verification active (`STRIPE_WEBHOOK_SECRET` set)
- [ ] Rate limiting on auth routes active (10 req/min per IP on `/api/auth/*`)
- [ ] Security headers confirmed in browser DevTools → Network → Response Headers:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Content-Security-Policy` present
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy` present
  - [ ] `Strict-Transport-Security` present (HSTS)
- [ ] CORS only allows `omanye.io`, `*.vercel.app`, `localhost:3000`

---

## Database

- [ ] All migrations applied in production (`supabase db push --linked`)
- [ ] Migration order verified: 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 010
- [ ] Performance indexes created (verify with `\di` in psql or Supabase SQL editor)
- [ ] Supabase backups enabled (PITR on Pro, or daily backup on Starter)
- [ ] Storage bucket policies set to **private** for all buckets
- [ ] No test/seed data present in production database

---

## Stripe

- [ ] Test mode → **live mode** keys swapped in Vercel env vars
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is `pk_live_...`
- [ ] `STRIPE_SECRET_KEY` is `sk_live_...`
- [ ] Webhook endpoint registered in Stripe **live mode** dashboard
  - Endpoint: `https://omanye.io/api/billing/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`,
    `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.paid`
- [ ] `STRIPE_WEBHOOK_SECRET` updated with live mode signing secret (`whsec_live_...`)
- [ ] All `NEXT_PUBLIC_STRIPE_*` price IDs updated to live price IDs
- [ ] Stripe billing portal URL configured (if using customer portal)
- [ ] Test a real payment end-to-end with a live card

---

## Auth

- [ ] Supabase redirect URLs allowlisted:
  - `https://omanye.io/auth/callback`
  - `https://*.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- [ ] Email templates customized with OMANYE branding in Supabase dashboard
  - Confirmation email
  - Password reset email
  - Magic link email
- [ ] Password reset flow tested end-to-end
- [ ] NGO signup → onboarding → dashboard flow tested
- [ ] Donor signup → invitation acceptance → donor dashboard flow tested
- [ ] OAuth providers (if any) configured with production callback URLs

---

## Performance

- [ ] All images using Next.js `<Image>` component (not plain `<img>`)
- [ ] Images served from Supabase Storage with transform params:
  - Avatars: `?width=80&height=80`
  - Program covers: `?width=800&height=400`
  - Org logos: `?width=200&height=200`
- [ ] Dynamic imports applied to heavy components:
  - `ReportPreview` (uses `@react-pdf/renderer`)
  - Recharts chart components
  - `PdfTemplate`
- [ ] Lighthouse score > 85 on homepage (`https://omanye.io`)
- [ ] No layout shift (CLS < 0.1) on program and dashboard pages
- [ ] Core Web Vitals checked in Vercel Analytics after first real traffic

---

## Error Handling & Monitoring

- [ ] Global `error.tsx` renders correctly (test by visiting a route that throws)
- [ ] `not-found.tsx` renders correctly (test by visiting `/this-does-not-exist`)
- [ ] API routes return standardized error shape `{ error, message, details? }`
- [ ] Console errors cleaned up — no unhandled promise rejections in browser console
- [ ] Sentry (or equivalent) configured if using error monitoring
- [ ] Vercel deployment notifications set up (Slack / email)

---

## Testing

- [ ] Smoke tests pass against staging environment: `npm test`
  - `auth.test.ts` — signup flows, redirect guards
  - `programs.test.ts` — role enforcement
  - `donor_access.test.ts` — access level gates, expenditure isolation
  - `billing.test.ts` — plan limits, webhook reachability
- [ ] Manual QA sign-off on critical paths:
  - [ ] NGO creates program → adds indicator → records expenditure → generates report
  - [ ] NGO invites donor → donor accepts → donor views program at correct access level
  - [ ] NGO upgrades plan via Stripe checkout → program limit increases
  - [ ] Field data submission → review workflow

---

## Infrastructure

- [ ] Custom domain `omanye.io` pointing to Vercel
- [ ] `www.omanye.io` redirects to `omanye.io` (or vice versa — pick one canonical)
- [ ] SSL certificate active and auto-renewing (Vercel handles this automatically)
- [ ] Vercel region set to closest to primary users (`iad1` for US East)
- [ ] Edge functions deployed (`send-donor-invitation`, `send-team-invitation`)
- [ ] Edge function secrets set via `supabase secrets set`

---

## Final Sign-Off

- [ ] Product owner reviewed all critical user flows in staging
- [ ] Security review completed
- [ ] DNS propagation confirmed (`dig omanye.io`)
- [ ] Monitoring dashboard bookmarked and oncall contact set
- [ ] Rollback plan documented (see DEPLOYMENT.md)
- [ ] **Go / No-Go decision made** — proceed to production
