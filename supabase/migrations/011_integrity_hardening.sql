-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Data Integrity Hardening  —  Migration 011
-- Fixes: missing ON DELETE clauses, audit log cascade, CHECK constraints,
--        duplicate invitation prevention, budget view soft-delete filtering
-- ─────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. AUDIT LOG: Prevent org deletion from wiping audit trail
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.audit_log
  DROP CONSTRAINT audit_log_organization_id_fkey,
  ADD  CONSTRAINT audit_log_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE RESTRICT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FIELD DATA: Add missing ON DELETE clauses to user references
-- ═══════════════════════════════════════════════════════════════════════════

-- field_collection_forms.created_by — prevent deleting users who created forms
ALTER TABLE public.field_collection_forms
  DROP CONSTRAINT field_collection_forms_created_by_fkey,
  ADD  CONSTRAINT field_collection_forms_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT;

-- field_submissions.submitted_by — prevent deleting users who submitted data
ALTER TABLE public.field_submissions
  DROP CONSTRAINT field_submissions_submitted_by_fkey,
  ADD  CONSTRAINT field_submissions_submitted_by_fkey
    FOREIGN KEY (submitted_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT;

-- field_submissions.reviewed_by — nullify reviewer on profile deletion
ALTER TABLE public.field_submissions
  DROP CONSTRAINT field_submissions_reviewed_by_fkey,
  ADD  CONSTRAINT field_submissions_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. DONOR ACCESS: Add explicit ON DELETE to granted_by
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.donor_program_access
  DROP CONSTRAINT donor_program_access_granted_by_fkey,
  ADD  CONSTRAINT donor_program_access_granted_by_fkey
    FOREIGN KEY (granted_by) REFERENCES public.profiles(id)
    ON DELETE RESTRICT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. BUDGET AMENDMENTS: Prevent org deletion wiping immutable audit trail
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.budget_amendments
  DROP CONSTRAINT budget_amendments_organization_id_fkey,
  ADD  CONSTRAINT budget_amendments_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE RESTRICT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. BILLING EVENTS: Prevent org deletion orphaning billing records
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.billing_events
  DROP CONSTRAINT billing_events_organization_id_fkey,
  ADD  CONSTRAINT billing_events_organization_id_fkey
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
    ON DELETE RESTRICT;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. CHECK CONSTRAINTS: Data validation at the database level
-- ═══════════════════════════════════════════════════════════════════════════

-- Programs: end date must be on or after start date
ALTER TABLE public.programs
  ADD CONSTRAINT chk_programs_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Expenditures: amount must be positive
ALTER TABLE public.expenditures
  ADD CONSTRAINT chk_expenditures_positive_amount
    CHECK (amount > 0);

-- Budget categories: allocated amount must be non-negative
ALTER TABLE public.budget_categories
  ADD CONSTRAINT chk_budget_categories_nonneg_amount
    CHECK (allocated_amount >= 0);

-- Budget amendments: transfer amount must be positive
ALTER TABLE public.budget_amendments
  ADD CONSTRAINT chk_budget_amendments_positive_amount
    CHECK (amount > 0);

-- Funding tranches: expected amount must be positive
ALTER TABLE public.funding_tranches
  ADD CONSTRAINT chk_funding_tranches_positive_expected
    CHECK (expected_amount > 0);

-- Funding tranches: received amount must be non-negative when set
ALTER TABLE public.funding_tranches
  ADD CONSTRAINT chk_funding_tranches_nonneg_received
    CHECK (received_amount IS NULL OR received_amount >= 0);

-- Indicators: target value must be non-negative
ALTER TABLE public.indicators
  ADD CONSTRAINT chk_indicators_nonneg_target
    CHECK (target_value >= 0);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. UNIQUE CONSTRAINTS: Prevent duplicate pending invitations
-- ═══════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_pending_email_org
  ON public.team_invitations (email, organization_id)
  WHERE status = 'PENDING';

CREATE UNIQUE INDEX IF NOT EXISTS idx_donor_invitations_pending_email_prog
  ON public.donor_invitations (email, program_id)
  WHERE status = 'PENDING';

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. BUDGET VIEWS: Filter out soft-deleted programs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.v_budget_summary AS
SELECT
  bc.program_id,
  bc.organization_id,
  SUM(bc.allocated_amount)                                               AS total_allocated,
  COALESCE(
    (SELECT SUM(e.amount)
     FROM   public.expenditures e
     WHERE  e.program_id = bc.program_id
     AND    e.status     = 'APPROVED'),
    0
  )                                                                      AS total_spent,
  SUM(bc.allocated_amount) - COALESCE(
    (SELECT SUM(e.amount)
     FROM   public.expenditures e
     WHERE  e.program_id = bc.program_id
     AND    e.status     = 'APPROVED'),
    0
  )                                                                      AS total_remaining,
  ROUND(
    COALESCE(
      (SELECT SUM(e.amount)
       FROM   public.expenditures e
       WHERE  e.program_id = bc.program_id
       AND    e.status     = 'APPROVED'),
      0
    ) / NULLIF(SUM(bc.allocated_amount), 0) * 100,
    1
  )                                                                      AS burn_rate_pct
FROM public.budget_categories bc
JOIN public.programs p ON p.id = bc.program_id AND p.deleted_at IS NULL
GROUP BY bc.program_id, bc.organization_id;

CREATE OR REPLACE VIEW public.v_category_spend AS
SELECT
  bc.id              AS category_id,
  bc.program_id,
  bc.organization_id,
  bc.name,
  bc.description,
  bc.allocated_amount,
  bc.currency,
  bc.color,
  bc.sort_order,
  COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'APPROVED'), 0)       AS spent,
  bc.allocated_amount - COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'APPROVED'), 0) AS remaining,
  ROUND(
    COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'APPROVED'), 0)
    / NULLIF(bc.allocated_amount, 0) * 100,
    1
  )                                                                      AS burn_rate_pct
FROM public.budget_categories bc
JOIN public.programs p ON p.id = bc.program_id AND p.deleted_at IS NULL
LEFT JOIN public.expenditures e ON e.budget_category_id = bc.id
GROUP BY bc.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE public.audit_log DROP CONSTRAINT audit_log_organization_id_fkey,
--   ADD CONSTRAINT audit_log_organization_id_fkey FOREIGN KEY (organization_id)
--   REFERENCES public.organizations(id) ON DELETE CASCADE;
-- (Repeat similar pattern for each constraint change above)
-- DROP INDEX IF EXISTS idx_team_invitations_pending_email_org;
-- DROP INDEX IF EXISTS idx_donor_invitations_pending_email_prog;
-- ALTER TABLE public.programs DROP CONSTRAINT chk_programs_dates;
-- ALTER TABLE public.expenditures DROP CONSTRAINT chk_expenditures_positive_amount;
-- ALTER TABLE public.budget_categories DROP CONSTRAINT chk_budget_categories_nonneg_amount;
-- ALTER TABLE public.budget_amendments DROP CONSTRAINT chk_budget_amendments_positive_amount;
-- ALTER TABLE public.funding_tranches DROP CONSTRAINT chk_funding_tranches_positive_expected;
-- ALTER TABLE public.funding_tranches DROP CONSTRAINT chk_funding_tranches_nonneg_received;
-- ALTER TABLE public.indicators DROP CONSTRAINT chk_indicators_nonneg_target;
