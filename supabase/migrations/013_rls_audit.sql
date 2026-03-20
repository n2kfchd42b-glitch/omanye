-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  RLS Audit & Hardening + Performance Indexes  —  Migration 013
-- Run with:  supabase db push
-- Rollback:  see ROLLBACK section at bottom of file
--
-- RENAME HISTORY:
--   Originally created as 010_rls_audit.sql.  At the time, 010_contact_submissions.sql
--   already existed, creating a duplicate 010_ prefix that would cause ordering
--   ambiguity on a fresh supabase db push.  This file was therefore renamed to
--   013_rls_audit.sql (after 012_funder_opportunities.sql) so the migration
--   sequence is unambiguous.  SQL content is unchanged from the original.
--   Additional RESTRICTIVE policies (Section 4) were appended during the rename.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: CRITICAL RLS HARDENING
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1a. donor_program_access — hide internal_notes from DONOR role ──────────
-- The existing SELECT policy allows donors to read their own rows, which
-- exposes internal_notes. This RESTRICTIVE policy blocks the entire row
-- for donors; field-level filtering happens at the API layer afterward.

DROP POLICY IF EXISTS "Hide internal notes from donors" ON public.donor_program_access;

CREATE POLICY "Hide internal notes from donors"
  ON public.donor_program_access
  AS RESTRICTIVE
  FOR SELECT
  USING (
    CASE
      WHEN auth.jwt() ->> 'role' = 'DONOR'
        THEN false            -- Deny entire row; API layer strips/nulls notes
      ELSE
        organization_id = (
          SELECT organization_id FROM public.profiles
          WHERE id = auth.uid()
        )
    END
  );

-- NOTE: The existing permissive "donor_read_own_access" policy already
-- allows donors to see their rows. The RESTRICTIVE policy above overrides
-- it for DONORs. For NGO members, the ELSE branch enforces same-org reads.

-- ── 1b. expenditures — no donor access under any condition ───────────────────
-- Ensures no permissive policy can ever expose expenditure rows to donors.

DROP POLICY IF EXISTS "No donor access to expenditures" ON public.expenditures;

CREATE POLICY "No donor access to expenditures"
  ON public.expenditures
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 1c. audit_log — revoke write access from authenticated role ───────────────
-- The audit_log must be append-only via service role only.
-- All permissive INSERT/UPDATE/DELETE policies are dropped; service role
-- bypasses RLS so writes still work from server-side actions.

REVOKE INSERT, UPDATE, DELETE ON public.audit_log FROM authenticated;

-- Also ensure no permissive INSERT policy exists
DROP POLICY IF EXISTS "audit_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_admin_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_staff_insert" ON public.audit_log;

-- ── 1d. field_submissions — zero donor access ────────────────────────────────
-- field_submissions contain raw field data; donors must never read these.

DROP POLICY IF EXISTS "donor_select_field_submissions" ON public.field_submissions;
DROP POLICY IF EXISTS "donor_read_field_submissions" ON public.field_submissions;

-- Add explicit RESTRICTIVE deny for DONOR role as defence in depth
DROP POLICY IF EXISTS "No donor access to field submissions" ON public.field_submissions;

CREATE POLICY "No donor access to field submissions"
  ON public.field_submissions
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 1e. profiles — prevent cross-org leaks ────────────────────────────────────
-- Users must only read profiles within their own organization.
-- Replace the existing permissive policy to enforce org boundary strictly.

DROP POLICY IF EXISTS "profiles_same_org_select" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in same org" ON public.profiles;

CREATE POLICY "profiles_same_org_select"
  ON public.profiles
  FOR SELECT
  USING (
    -- Own profile: always readable
    id = auth.uid()
    OR
    -- Same org: readable by authenticated org members
    (
      organization_id IS NOT NULL
      AND organization_id = (
        SELECT organization_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- Donors can read their own profile but NOT NGO member profiles
-- The above policy allows same-org reads; donors only belong to no org
-- (organization_id IS NULL for donors), so only own-profile clause applies.

-- ── 1f. notifications — NGO internal notifications not readable by donors ─────
-- The existing policy already gates on recipient_id = auth.uid().
-- Verify DONOR role cannot read NGO notifications by adding explicit block.

DROP POLICY IF EXISTS "No donor access to ngo notifications" ON public.notifications;

CREATE POLICY "No donor access to ngo notifications"
  ON public.notifications
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 1g. donor_notifications — NGO team cannot read donor notifications ────────
-- Donors' private notifications must not be readable by NGO staff.

DROP POLICY IF EXISTS "No ngo access to donor notifications" ON public.donor_notifications;

CREATE POLICY "No ngo access to donor notifications"
  ON public.donor_notifications
  AS RESTRICTIVE
  FOR SELECT
  USING (
    -- Only the donor themselves (existing permissive policy handles this)
    -- This restrictive policy BLOCKS anyone who is not the donor
    donor_id = auth.uid()
    OR
    -- Service role bypass (no auth.uid() in service role context)
    auth.uid() IS NULL
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: VERIFICATION QUERIES
-- Run after applying to confirm all policies are in place.
-- ─────────────────────────────────────────────────────────────────────────────

-- Uncomment to verify:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM   pg_policies
-- WHERE  schemaname = 'public'
-- ORDER  BY tablename, policyname;

-- Expected critical rows:
--   donor_program_access | Hide internal notes from donors    | RESTRICTIVE | SELECT
--   expenditures         | No donor access to expenditures    | RESTRICTIVE | SELECT
--   field_submissions    | No donor access to field submissions| RESTRICTIVE | SELECT
--   notifications        | No donor access to ngo notifications| RESTRICTIVE | SELECT
--   donor_notifications  | No ngo access to donor notifications| RESTRICTIVE | SELECT
--   profiles             | profiles_same_org_select           | PERMISSIVE  | SELECT

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Programs queries
CREATE INDEX IF NOT EXISTS idx_programs_org_status
  ON public.programs(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_programs_visibility
  ON public.programs(visibility) WHERE visibility = 'PUBLIC';

-- Indicators queries
CREATE INDEX IF NOT EXISTS idx_indicators_program
  ON public.indicators(program_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_indicator_updates_indicator_date
  ON public.indicator_updates(indicator_id, submitted_at DESC);

-- Donor access queries (most frequent join path)
CREATE INDEX IF NOT EXISTS idx_donor_program_access_donor
  ON public.donor_program_access(donor_id, active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_donor_program_access_org
  ON public.donor_program_access(organization_id, active) WHERE active = TRUE;

-- Audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created
  ON public.audit_log(organization_id, created_at DESC);

-- Notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read
  ON public.notifications(recipient_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_donor_notifications_recipient_read
  ON public.donor_notifications(donor_id, read, created_at DESC);

-- Expenditures queries
CREATE INDEX IF NOT EXISTS idx_expenditures_program_status
  ON public.expenditures(program_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: ADDITIONAL RESTRICTIVE POLICIES (added when migration renumbered 013)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 4a. field_collection_forms — no donor access ─────────────────────────────
-- Donors have no business reading form schema definitions (field configs etc.)
-- The ngo_read_forms policy gates on organization_id subquery; DONORs have
-- organization_id = NULL so they already can't match, but a RESTRICTIVE policy
-- makes this explicit and future-proof.

DROP POLICY IF EXISTS "No donor access to field forms" ON public.field_collection_forms;

CREATE POLICY "No donor access to field forms"
  ON public.field_collection_forms
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'DONOR'
    )
  );

-- ── 4b. reports — donors may never read non-visible reports ──────────────────
-- The permissive donor_read_reports policy already requires visible_to_donors=TRUE.
-- This RESTRICTIVE policy is a defense-in-depth guarantee: even if a future
-- permissive policy were to accidentally grant broader donor access, donors can
-- still never read a report unless visible_to_donors is explicitly set.

DROP POLICY IF EXISTS "Donors only see visible reports" ON public.reports;

CREATE POLICY "Donors only see visible reports"
  ON public.reports
  AS RESTRICTIVE
  FOR SELECT
  USING (
    CASE
      WHEN public.current_user_role() = 'DONOR'
        THEN visible_to_donors = TRUE
      ELSE TRUE  -- NGO members: unrestricted by this policy
    END
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK NOTES
-- ─────────────────────────────────────────────────────────────────────────────
-- To reverse the restrictive policies:
--   DROP POLICY IF EXISTS "Hide internal notes from donors"       ON public.donor_program_access;
--   DROP POLICY IF EXISTS "No donor access to expenditures"       ON public.expenditures;
--   DROP POLICY IF EXISTS "No donor access to field submissions"  ON public.field_submissions;
--   DROP POLICY IF EXISTS "No donor access to ngo notifications"  ON public.notifications;
--   DROP POLICY IF EXISTS "No ngo access to donor notifications"  ON public.donor_notifications;
--   DROP POLICY IF EXISTS "No donor access to field forms"        ON public.field_collection_forms;
--   DROP POLICY IF EXISTS "Donors only see visible reports"       ON public.reports;
--
-- To reverse indexes (non-destructive — only removes query optimization):
--   DROP INDEX IF EXISTS idx_programs_org_status;
--   DROP INDEX IF EXISTS idx_programs_visibility;
--   DROP INDEX IF EXISTS idx_indicators_program;
--   DROP INDEX IF EXISTS idx_indicator_updates_indicator_date;
--   DROP INDEX IF EXISTS idx_donor_program_access_donor;
--   DROP INDEX IF EXISTS idx_donor_program_access_org;
--   DROP INDEX IF EXISTS idx_audit_log_org_created;
--   DROP INDEX IF EXISTS idx_notifications_recipient_read;
--   DROP INDEX IF EXISTS idx_donor_notifications_recipient_read;
--   DROP INDEX IF EXISTS idx_expenditures_program_status;
--
-- To restore audit_log write grant (not recommended):
--   GRANT INSERT ON public.audit_log TO authenticated;
