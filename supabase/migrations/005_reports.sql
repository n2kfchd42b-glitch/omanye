-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Donor Reports  —  Migration 005
-- Run with:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE public.report_type AS ENUM (
  'PROGRESS',
  'QUARTERLY',
  'ANNUAL',
  'FIELD',
  'DONOR_BRIEF',
  'FINAL'
);

CREATE TYPE public.report_status AS ENUM (
  'DRAFT',
  'GENERATED',
  'SUBMITTED',
  'ARCHIVED'
);

-- ── reports ───────────────────────────────────────────────────────────────────

CREATE TABLE public.reports (
  id                     UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id             UUID              NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  title                  TEXT              NOT NULL,
  report_type            public.report_type NOT NULL DEFAULT 'PROGRESS',
  reporting_period_start DATE,
  reporting_period_end   DATE,
  sections               JSONB             NOT NULL DEFAULT '[]'::jsonb,
  content                JSONB             NOT NULL DEFAULT '{}'::jsonb,
  challenges             TEXT,
  status                 public.report_status NOT NULL DEFAULT 'DRAFT',
  visible_to_donors      BOOLEAN           NOT NULL DEFAULT FALSE,
  submitted_to           TEXT[]            NOT NULL DEFAULT '{}',
  generated_at           TIMESTAMPTZ,
  submitted_at           TIMESTAMPTZ,
  created_by             UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at             TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_org         ON public.reports(organization_id);
CREATE INDEX idx_reports_program     ON public.reports(program_id);
CREATE INDEX idx_reports_status      ON public.reports(status);
CREATE INDEX idx_reports_visible     ON public.reports(visible_to_donors);
CREATE INDEX idx_reports_created_by  ON public.reports(created_by);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_reports_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- NGO members: read all reports in their org
CREATE POLICY "ngo_read_reports"
  ON public.reports FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN: full write access
CREATE POLICY "ngo_admin_insert_reports"
  ON public.reports FOR INSERT
  WITH CHECK (public.is_ngo_admin(organization_id));

CREATE POLICY "ngo_admin_update_reports"
  ON public.reports FOR UPDATE
  USING (public.is_ngo_admin(organization_id));

CREATE POLICY "ngo_admin_delete_reports"
  ON public.reports FOR DELETE
  USING (public.is_ngo_admin(organization_id) AND status = 'DRAFT');

-- NGO_STAFF: can create and update DRAFT reports
CREATE POLICY "ngo_staff_insert_reports"
  ON public.reports FOR INSERT
  WITH CHECK (
    public.is_ngo_editor(organization_id)
    AND NOT public.is_ngo_admin(organization_id)
  );

CREATE POLICY "ngo_staff_update_reports"
  ON public.reports FOR UPDATE
  USING (
    public.is_ngo_editor(organization_id)
    AND NOT public.is_ngo_admin(organization_id)
    AND status = 'DRAFT'
  );

-- DONOR: read visible reports for programs they have active access to
CREATE POLICY "donor_read_reports"
  ON public.reports FOR SELECT
  USING (
    visible_to_donors = TRUE
    AND public.donor_can_access_program(program_id)
  );
