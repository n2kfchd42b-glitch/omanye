-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Budget & Financial Tracking  —  Migration 003
-- Run with:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.expenditure_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'VOID'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tranche_status AS ENUM (
    'EXPECTED',
    'RECEIVED',
    'DELAYED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── budget_categories ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.budget_categories (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       UUID        NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id  UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  description      TEXT,
  allocated_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency         TEXT        NOT NULL DEFAULT 'USD',
  color            TEXT        NOT NULL DEFAULT '#4CAF78',
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS budget_categories_updated_at ON public.budget_categories;
CREATE TRIGGER budget_categories_updated_at
  BEFORE UPDATE ON public.budget_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

-- ── expenditures ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.expenditures (
  id                   UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id           UUID                       NOT NULL REFERENCES public.programs(id)          ON DELETE CASCADE,
  organization_id      UUID                       NOT NULL REFERENCES public.organizations(id)     ON DELETE CASCADE,
  budget_category_id   UUID                       REFERENCES public.budget_categories(id)          ON DELETE SET NULL,
  description          TEXT                       NOT NULL,
  amount               NUMERIC(15,2)              NOT NULL,
  currency             TEXT                       NOT NULL DEFAULT 'USD',
  transaction_date     DATE                       NOT NULL,
  payment_method       TEXT,
  reference_number     TEXT,
  receipt_url          TEXT,
  approved_by          UUID                       REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at          TIMESTAMPTZ,
  status               public.expenditure_status  NOT NULL DEFAULT 'PENDING',
  notes                TEXT,
  submitted_by         UUID                       NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS expenditures_updated_at ON public.expenditures;
CREATE TRIGGER expenditures_updated_at
  BEFORE UPDATE ON public.expenditures
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;

-- ── budget_amendments ─────────────────────────────────────────────────────────
-- Immutable audit trail — no UPDATE or DELETE.

CREATE TABLE IF NOT EXISTS public.budget_amendments (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id       UUID          NOT NULL REFERENCES public.programs(id)           ON DELETE CASCADE,
  organization_id  UUID          NOT NULL REFERENCES public.organizations(id)      ON DELETE CASCADE,
  from_category_id UUID          NOT NULL REFERENCES public.budget_categories(id)  ON DELETE RESTRICT,
  to_category_id   UUID          NOT NULL REFERENCES public.budget_categories(id)  ON DELETE RESTRICT,
  amount           NUMERIC(15,2) NOT NULL,
  reason           TEXT          NOT NULL,
  approved_by      UUID          NOT NULL REFERENCES public.profiles(id)           ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.budget_amendments ENABLE ROW LEVEL SECURITY;

-- ── funding_tranches ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.funding_tranches (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID                  NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id UUID                  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_id        UUID                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  funder_name     TEXT,
  tranche_number  INTEGER               NOT NULL DEFAULT 1,
  expected_amount NUMERIC(15,2)         NOT NULL,
  received_amount NUMERIC(15,2),
  currency        TEXT                  NOT NULL DEFAULT 'USD',
  expected_date   DATE                  NOT NULL,
  received_date   DATE,
  status          public.tranche_status NOT NULL DEFAULT 'EXPECTED',
  notes           TEXT,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS funding_tranches_updated_at ON public.funding_tranches;
CREATE TRIGGER funding_tranches_updated_at
  BEFORE UPDATE ON public.funding_tranches
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.funding_tranches ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_budget_categories_program   ON public.budget_categories(program_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_org       ON public.budget_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_program        ON public.expenditures(program_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_org            ON public.expenditures(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_category       ON public.expenditures(budget_category_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_status         ON public.expenditures(status);
CREATE INDEX IF NOT EXISTS idx_expenditures_date           ON public.expenditures(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenditures_submitted_by   ON public.expenditures(submitted_by);
CREATE INDEX IF NOT EXISTS idx_budget_amendments_program   ON public.budget_amendments(program_id);
CREATE INDEX IF NOT EXISTS idx_budget_amendments_org       ON public.budget_amendments(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_tranches_program    ON public.funding_tranches(program_id);
CREATE INDEX IF NOT EXISTS idx_funding_tranches_org        ON public.funding_tranches(organization_id);
CREATE INDEX IF NOT EXISTS idx_funding_tranches_donor      ON public.funding_tranches(donor_id);
CREATE INDEX IF NOT EXISTS idx_funding_tranches_status     ON public.funding_tranches(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Computed Views
-- ─────────────────────────────────────────────────────────────────────────────

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
LEFT JOIN public.expenditures e ON e.budget_category_id = bc.id
GROUP BY bc.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── budget_categories ─────────────────────────────────────────────────────────

-- NGO members can read categories for their org
DROP POLICY IF EXISTS "ngo_members_select_budget_categories" ON public.budget_categories;
CREATE POLICY "ngo_members_select_budget_categories"
  ON public.budget_categories FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN only creates/updates/deletes categories
DROP POLICY IF EXISTS "ngo_admin_insert_budget_categories" ON public.budget_categories;
CREATE POLICY "ngo_admin_insert_budget_categories"
  ON public.budget_categories FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

DROP POLICY IF EXISTS "ngo_admin_update_budget_categories" ON public.budget_categories;
CREATE POLICY "ngo_admin_update_budget_categories"
  ON public.budget_categories FOR UPDATE
  USING (public.is_ngo_admin(organization_id));

DROP POLICY IF EXISTS "ngo_admin_delete_budget_categories" ON public.budget_categories;
CREATE POLICY "ngo_admin_delete_budget_categories"
  ON public.budget_categories FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- Donors: readable if INDICATORS_AND_BUDGET or FULL
DROP POLICY IF EXISTS "donors_select_budget_categories" ON public.budget_categories;
CREATE POLICY "donors_select_budget_categories"
  ON public.budget_categories FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND public.donor_can_access_program(program_id)
    AND (
      SELECT access_level FROM public.donor_program_access
      WHERE  program_id = budget_categories.program_id
      AND    donor_id   = auth.uid()
      AND    active     = TRUE
      AND    (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    ) IN ('INDICATORS_AND_BUDGET', 'FULL')
  );

-- ── expenditures ──────────────────────────────────────────────────────────────

-- NGO members can read expenditures for their org
DROP POLICY IF EXISTS "ngo_members_select_expenditures" ON public.expenditures;
CREATE POLICY "ngo_members_select_expenditures"
  ON public.expenditures FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN and NGO_STAFF can submit (creates PENDING)
DROP POLICY IF EXISTS "ngo_editors_insert_expenditures" ON public.expenditures;
CREATE POLICY "ngo_editors_insert_expenditures"
  ON public.expenditures FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

-- NGO_ADMIN can update any expenditure (approve/reject/void)
-- NGO_STAFF can only update their own PENDING expenditures
DROP POLICY IF EXISTS "ngo_admin_update_expenditures" ON public.expenditures;
CREATE POLICY "ngo_admin_update_expenditures"
  ON public.expenditures FOR UPDATE
  USING (
    (public.is_ngo_admin(organization_id))
    OR (
      public.current_user_role() = 'NGO_STAFF'
      AND submitted_by = auth.uid()
      AND status       = 'PENDING'
      AND organization_id = public.current_user_org()
    )
  );

-- NGO_STAFF can delete their own PENDING; NGO_ADMIN can delete any PENDING
DROP POLICY IF EXISTS "ngo_delete_expenditures" ON public.expenditures;
CREATE POLICY "ngo_delete_expenditures"
  ON public.expenditures FOR DELETE
  USING (
    organization_id = public.current_user_org()
    AND status      = 'PENDING'
    AND (
      public.current_user_role() = 'NGO_ADMIN'
      OR submitted_by = auth.uid()
    )
  );

-- Donors: NO access to individual expenditures under any level
-- (no SELECT policy for DONOR role — intentional)

-- ── budget_amendments ─────────────────────────────────────────────────────────

-- NGO members can read amendments
DROP POLICY IF EXISTS "ngo_members_select_amendments" ON public.budget_amendments;
CREATE POLICY "ngo_members_select_amendments"
  ON public.budget_amendments FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- Only NGO_ADMIN can create amendments
DROP POLICY IF EXISTS "ngo_admin_insert_amendments" ON public.budget_amendments;
CREATE POLICY "ngo_admin_insert_amendments"
  ON public.budget_amendments FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

-- Amendments are immutable — no UPDATE or DELETE policy

-- ── funding_tranches ──────────────────────────────────────────────────────────

-- NGO members can read all tranches for their org
DROP POLICY IF EXISTS "ngo_members_select_tranches" ON public.funding_tranches;
CREATE POLICY "ngo_members_select_tranches"
  ON public.funding_tranches FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN can create and update tranches
DROP POLICY IF EXISTS "ngo_admin_insert_tranches" ON public.funding_tranches;
CREATE POLICY "ngo_admin_insert_tranches"
  ON public.funding_tranches FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

DROP POLICY IF EXISTS "ngo_admin_update_tranches" ON public.funding_tranches;
CREATE POLICY "ngo_admin_update_tranches"
  ON public.funding_tranches FOR UPDATE
  USING (public.is_ngo_admin(organization_id));

-- Donors: readable if INDICATORS_AND_BUDGET and it's their tranche,
--   OR access_level = FULL (see all tranches for programs they have full access to)
DROP POLICY IF EXISTS "donors_select_tranches" ON public.funding_tranches;
CREATE POLICY "donors_select_tranches"
  ON public.funding_tranches FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND public.donor_can_access_program(program_id)
    AND (
      SELECT access_level FROM public.donor_program_access
      WHERE  program_id = funding_tranches.program_id
      AND    donor_id   = auth.uid()
      AND    active     = TRUE
      AND    (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    ) IN ('INDICATORS_AND_BUDGET', 'FULL')
    AND (
      -- FULL: see all tranches
      (
        SELECT access_level FROM public.donor_program_access
        WHERE  program_id = funding_tranches.program_id
        AND    donor_id   = auth.uid()
        AND    active     = TRUE
        AND    (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
      ) = 'FULL'
      -- INDICATORS_AND_BUDGET: only own tranches
      OR donor_id = auth.uid()
    )
  );
