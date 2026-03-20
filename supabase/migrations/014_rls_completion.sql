-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  RLS Audit Completion  —  Migration 014
-- Run with:  supabase db push
--
-- PURPOSE:
--   Adds RESTRICTIVE policies as a second line of defence for tables that
--   already deny access to donors/unrelated roles via the absence of permissive
--   policies, but lack an explicit RESTRICTIVE guarantee.
--   This ensures that a future accidental permissive policy addition cannot
--   expose sensitive data without the RESTRICTIVE layer being updated first.
--
-- TABLES REVIEWED:
--   See the audit log at the bottom of this file for every table checked.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. audit_log — no donor read access ──────────────────────────────────────
-- The permissive policies only allow NGO_ADMIN and NGO_STAFF to read audit rows
-- for their own org. There is no permissive policy for donors. This RESTRICTIVE
-- policy makes the denial explicit and future-proof.

DROP POLICY IF EXISTS "No donor access to audit log" ON public.audit_log;

CREATE POLICY "No donor access to audit log"
  ON public.audit_log
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 2. budget_amendments — no donor read access ───────────────────────────────
-- budget_amendments are an immutable financial audit trail. Donors have no
-- permissive SELECT policy. This RESTRICTIVE policy explicitly blocks donors
-- as defense-in-depth.

DROP POLICY IF EXISTS "No donor access to budget amendments" ON public.budget_amendments;

CREATE POLICY "No donor access to budget amendments"
  ON public.budget_amendments
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 3. program_assignments — no donor read access ─────────────────────────────
-- program_assignments record which NGO staff are assigned to which programs.
-- This is internal org data. No donor permissive policy exists. Making explicit.

DROP POLICY IF EXISTS "No donor access to program assignments" ON public.program_assignments;

CREATE POLICY "No donor access to program assignments"
  ON public.program_assignments
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 4. subscriptions — no donor read access ───────────────────────────────────
-- Billing/subscription data is NGO-internal. The permissive policy gates on
-- NGO role. Adding RESTRICTIVE for explicit donor denial.

DROP POLICY IF EXISTS "No donor access to subscriptions" ON public.subscriptions;

CREATE POLICY "No donor access to subscriptions"
  ON public.subscriptions
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 5. billing_events — no authenticated user access ─────────────────────────
-- billing_events is service-role only (Stripe webhook idempotency log).
-- No permissive SELECT policies exist. This RESTRICTIVE explicitly blocks
-- all authenticated access, making the service-role-only intent unambiguous.

DROP POLICY IF EXISTS "No authenticated access to billing events" ON public.billing_events;

CREATE POLICY "No authenticated access to billing events"
  ON public.billing_events
  AS RESTRICTIVE
  FOR SELECT
  USING (FALSE);

-- ── 6. organizations — no cross-org donor leaks ───────────────────────────────
-- The permissive policy requires is_ngo_member(id), which donors cannot satisfy
-- (they have no organization_id). This RESTRICTIVE is defense-in-depth.

DROP POLICY IF EXISTS "No donor access to organizations" ON public.organizations;

CREATE POLICY "No donor access to organizations"
  ON public.organizations
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG — every table reviewed and its disposition
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Table                     | RLS | RESTRICTIVE added here | Notes
-- ─────────────────────────────────────────────────────────────────────────────
-- organizations             | ✓   | ✓ (#6)                 | NGO-only via permissive; RESTRICTIVE now explicit
-- profiles                  | ✓   | (013_rls_audit)        | profiles_same_org_select added in 013
-- donor_profiles            | ✓   | none needed            | Scoped to own + NGO_ADMIN only
-- programs                  | ✓   | (013_rls_audit)        | RESTRICTIVE for donors added implicitly via permissive scope; donors_select_accessible_programs is tightly scoped
-- indicators                | ✓   | none needed            | donors_select_indicators requires visible_to_donors=true + access level
-- indicator_updates         | ✓   | none needed            | donors_select_indicator_updates joins to visible indicators
-- program_updates           | ✓   | none needed            | donors_select_program_updates requires visible_to_donors=true
-- budget_categories         | ✓   | none needed            | donors_select_budget_categories requires INDICATORS_AND_BUDGET+
-- expenditures              | ✓   | (013_rls_audit)        | "No donor access to expenditures" RESTRICTIVE in 013
-- budget_amendments         | ✓   | ✓ (#2)                 | No permissive donor policy; RESTRICTIVE now explicit
-- funding_tranches          | ✓   | none needed            | donors_select_tranches scoped to INDICATORS_AND_BUDGET+ own tranche
-- reports                   | ✓   | (013_rls_audit)        | "Donors only see visible reports" RESTRICTIVE in 013
-- field_collection_forms    | ✓   | (013_rls_audit)        | "No donor access to field forms" RESTRICTIVE in 013
-- field_submissions         | ✓   | (013_rls_audit)        | "No donor access to field submissions" RESTRICTIVE in 013
-- donor_invitations         | ✓   | none needed            | public_read_invitation_by_token intentional (token=secret)
-- donor_notifications       | ✓   | (013_rls_audit)        | "No ngo access to donor notifications" RESTRICTIVE in 013
-- donor_program_access      | ✓   | (013_rls_audit)        | "Hide internal notes from donors" RESTRICTIVE in 013
-- donor_access_requests     | ✓   | none needed            | Permissive scope is donor_id=auth.uid() + NGO member; tight
-- team_invitations          | ✓   | none needed            | public_read_by_token intentional (token=secret)
-- program_assignments       | ✓   | ✓ (#3)                 | NGO-internal; RESTRICTIVE now explicit
-- audit_log                 | ✓   | ✓ (#1)                 | No donor permissive policy; RESTRICTIVE now explicit
-- notifications             | ✓   | (013_rls_audit)        | "No donor access to ngo notifications" RESTRICTIVE in 013
-- notification_preferences  | ✓   | none needed            | prefs_own scoped to profile_id = auth.uid()
-- subscriptions             | ✓   | ✓ (#4)                 | No donor permissive policy; RESTRICTIVE now explicit
-- billing_events            | ✓   | ✓ (#5)                 | Service-role only; RESTRICTIVE(FALSE) now explicit
-- contact_submissions       | ✓   | none needed            | INSERT only for anon; no SELECT for authenticated
-- funder_opportunities      | ✓   | none needed            | Intentionally readable by all authenticated users
-- ─────────────────────────────────────────────────────────────────────────────
