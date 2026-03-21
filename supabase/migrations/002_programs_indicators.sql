-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Programs & Indicators  —  Migration 002
-- Run with:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.program_visibility AS ENUM (
    'PRIVATE',      -- only org team sees it
    'DONOR_ONLY',   -- visible to linked donors per their access level
    'PUBLIC'        -- visible on public org profile (future feature, scaffold now)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.indicator_frequency AS ENUM (
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY',
    'ONCE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.update_type AS ENUM (
    'PROGRESS',
    'MILESTONE',
    'CHALLENGE',
    'DONOR_REPORT',
    'FIELD_DISPATCH'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Extend programs table ─────────────────────────────────────────────────────
-- Migration 001 created programs with: id, organization_id, name, status,
-- created_at, updated_at.  We add all operational columns here.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS description       TEXT,
  ADD COLUMN IF NOT EXISTS objective         TEXT,
  ADD COLUMN IF NOT EXISTS start_date        DATE,
  ADD COLUMN IF NOT EXISTS end_date          DATE,
  ADD COLUMN IF NOT EXISTS location_country  TEXT,
  ADD COLUMN IF NOT EXISTS location_region   TEXT,
  ADD COLUMN IF NOT EXISTS primary_funder    TEXT,
  ADD COLUMN IF NOT EXISTS total_budget      NUMERIC,
  ADD COLUMN IF NOT EXISTS currency          TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS logframe_url      TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility        public.program_visibility NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ;   -- soft-delete

-- ── indicators ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.indicators (
  id                 UUID                       PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id         UUID                       NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id    UUID                       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name               TEXT                       NOT NULL,
  description        TEXT,
  category           TEXT,
  unit               TEXT,
  target_value       NUMERIC,
  current_value      NUMERIC                    NOT NULL DEFAULT 0,
  baseline_value     NUMERIC,
  frequency          public.indicator_frequency NOT NULL DEFAULT 'MONTHLY',
  data_source        TEXT,
  is_key_indicator   BOOLEAN                    NOT NULL DEFAULT FALSE,
  visible_to_donors  BOOLEAN                    NOT NULL DEFAULT FALSE,
  sort_order         INTEGER                    NOT NULL DEFAULT 0,
  created_by         UUID                       REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ                NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS indicators_updated_at ON public.indicators;
CREATE TRIGGER indicators_updated_at
  BEFORE UPDATE ON public.indicators
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.indicators ENABLE ROW LEVEL SECURITY;

-- ── indicator_updates ─────────────────────────────────────────────────────────
-- Append-only time-series log; never overwrite, never delete.

CREATE TABLE IF NOT EXISTS public.indicator_updates (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id            UUID        NOT NULL REFERENCES public.indicators(id) ON DELETE CASCADE,
  program_id              UUID        NOT NULL REFERENCES public.programs(id)   ON DELETE CASCADE,
  organization_id         UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  previous_value          NUMERIC,
  new_value               NUMERIC     NOT NULL,
  reporting_period_start  DATE,
  reporting_period_end    DATE,
  notes                   TEXT,
  source                  TEXT,
  submitted_by            UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.indicator_updates ENABLE ROW LEVEL SECURITY;

-- ── program_updates ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_updates (
  id                 UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id         UUID                  NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id    UUID                  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title              TEXT                  NOT NULL,
  body               TEXT,
  update_type        public.update_type    NOT NULL DEFAULT 'PROGRESS',
  visible_to_donors  BOOLEAN               NOT NULL DEFAULT FALSE,
  attachments        JSONB                 DEFAULT '[]',
  published_at       TIMESTAMPTZ,
  created_by         UUID                  REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS program_updates_updated_at ON public.program_updates;
CREATE TRIGGER program_updates_updated_at
  BEFORE UPDATE ON public.program_updates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.program_updates ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_indicators_program_id       ON public.indicators(program_id);
CREATE INDEX IF NOT EXISTS idx_indicators_org_id           ON public.indicators(organization_id);
CREATE INDEX IF NOT EXISTS idx_indicators_key              ON public.indicators(is_key_indicator) WHERE is_key_indicator = TRUE;
CREATE INDEX IF NOT EXISTS idx_indicator_updates_ind_id    ON public.indicator_updates(indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicator_updates_prog_id   ON public.indicator_updates(program_id);
CREATE INDEX IF NOT EXISTS idx_indicator_updates_org_id    ON public.indicator_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_indicator_updates_time      ON public.indicator_updates(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_updates_prog_id     ON public.program_updates(program_id);
CREATE INDEX IF NOT EXISTS idx_program_updates_org_id      ON public.program_updates(organization_id);
CREATE INDEX IF NOT EXISTS idx_program_updates_visible     ON public.program_updates(visible_to_donors) WHERE visible_to_donors = TRUE;
CREATE INDEX IF NOT EXISTS idx_programs_visibility         ON public.programs(visibility);
CREATE INDEX IF NOT EXISTS idx_programs_deleted_at         ON public.programs(deleted_at) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: does the calling donor have an active, non-expired access grant
--         to a given program at or above a minimum access level?
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.donor_can_access_program(prog_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.donor_program_access dpa
    WHERE  dpa.program_id = prog_id
    AND    dpa.donor_id   = auth.uid()
    AND    dpa.active     = TRUE
    AND    (dpa.expires_at IS NULL OR dpa.expires_at > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION public.donor_access_level_for(prog_id UUID)
RETURNS public.access_level LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT access_level FROM public.donor_program_access
  WHERE  program_id = prog_id
  AND    donor_id   = auth.uid()
  AND    active     = TRUE
  AND    (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── programs (extend migration 001 with visibility & soft-delete filter) ──────

-- Donors: visible only if access grant exists AND visibility != PRIVATE
-- (The existing "donors_select_accessible_programs" policy in 001 allows all
-- accessible programs including PRIVATE ones, so we need to tighten it.)
DROP POLICY IF EXISTS "donors_select_accessible_programs" ON public.programs;

CREATE POLICY "donors_select_accessible_programs"
  ON public.programs FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND deleted_at IS NULL
    AND visibility <> 'PRIVATE'
    AND public.donor_can_access_program(id)
  );

-- NGO members: filter out soft-deleted programs
DROP POLICY IF EXISTS "ngo_members_select_programs" ON public.programs;

CREATE POLICY "ngo_members_select_programs"
  ON public.programs FOR SELECT
  USING (
    public.is_ngo_member(organization_id)
    AND deleted_at IS NULL
  );

-- ── indicators ────────────────────────────────────────────────────────────────

-- NGO members can read all indicators for their org
DROP POLICY IF EXISTS "ngo_members_select_indicators" ON public.indicators;
CREATE POLICY "ngo_members_select_indicators"
  ON public.indicators FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO editors (ADMIN + STAFF) can create/update indicators
DROP POLICY IF EXISTS "ngo_editors_insert_indicators" ON public.indicators;
CREATE POLICY "ngo_editors_insert_indicators"
  ON public.indicators FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

DROP POLICY IF EXISTS "ngo_editors_update_indicators" ON public.indicators;
CREATE POLICY "ngo_editors_update_indicators"
  ON public.indicators FOR UPDATE
  USING (public.is_ngo_editor(organization_id));

-- Only NGO_ADMIN can delete indicators
DROP POLICY IF EXISTS "ngo_admin_delete_indicators" ON public.indicators;
CREATE POLICY "ngo_admin_delete_indicators"
  ON public.indicators FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- Donors: see indicators only if they have a sufficient access level grant
--   AND the indicator is flagged visible_to_donors
--   AND their access level is INDICATORS or above
DROP POLICY IF EXISTS "donors_select_indicators" ON public.indicators;
CREATE POLICY "donors_select_indicators"
  ON public.indicators FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND visible_to_donors = TRUE
    AND public.donor_can_access_program(program_id)
    AND (
      SELECT access_level FROM public.donor_program_access
      WHERE  program_id = indicators.program_id
      AND    donor_id   = auth.uid()
      AND    active     = TRUE
      AND    (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    ) IN ('INDICATORS', 'INDICATORS_AND_BUDGET', 'FULL')
  );

-- ── indicator_updates ─────────────────────────────────────────────────────────

-- NGO members can read update history for their org
DROP POLICY IF EXISTS "ngo_members_select_indicator_updates" ON public.indicator_updates;
CREATE POLICY "ngo_members_select_indicator_updates"
  ON public.indicator_updates FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO editors can submit updates
DROP POLICY IF EXISTS "ngo_editors_insert_indicator_updates" ON public.indicator_updates;
CREATE POLICY "ngo_editors_insert_indicator_updates"
  ON public.indicator_updates FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

-- Indicator updates are append-only: no UPDATE or DELETE for anyone

-- Donors: same gate as indicators
DROP POLICY IF EXISTS "donors_select_indicator_updates" ON public.indicator_updates;
CREATE POLICY "donors_select_indicator_updates"
  ON public.indicator_updates FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND public.donor_can_access_program(program_id)
    AND EXISTS (
      SELECT 1 FROM public.indicators ind
      WHERE  ind.id                = indicator_updates.indicator_id
      AND    ind.visible_to_donors = TRUE
    )
    AND (
      SELECT access_level FROM public.donor_program_access
      WHERE  program_id = indicator_updates.program_id
      AND    donor_id   = auth.uid()
      AND    active     = TRUE
      AND    (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    ) IN ('INDICATORS', 'INDICATORS_AND_BUDGET', 'FULL')
  );

-- ── program_updates ───────────────────────────────────────────────────────────

-- NGO members can read all program updates for their org
DROP POLICY IF EXISTS "ngo_members_select_program_updates" ON public.program_updates;
CREATE POLICY "ngo_members_select_program_updates"
  ON public.program_updates FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO editors can create/update program updates
DROP POLICY IF EXISTS "ngo_editors_insert_program_updates" ON public.program_updates;
CREATE POLICY "ngo_editors_insert_program_updates"
  ON public.program_updates FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

DROP POLICY IF EXISTS "ngo_editors_update_program_updates" ON public.program_updates;
CREATE POLICY "ngo_editors_update_program_updates"
  ON public.program_updates FOR UPDATE
  USING (public.is_ngo_editor(organization_id));

-- Only NGO_ADMIN can delete program updates
DROP POLICY IF EXISTS "ngo_admin_delete_program_updates" ON public.program_updates;
CREATE POLICY "ngo_admin_delete_program_updates"
  ON public.program_updates FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- Donors: only visible_to_donors=true updates on accessible programs
DROP POLICY IF EXISTS "donors_select_program_updates" ON public.program_updates;
CREATE POLICY "donors_select_program_updates"
  ON public.program_updates FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND visible_to_donors = TRUE
    AND public.donor_can_access_program(program_id)
  );
