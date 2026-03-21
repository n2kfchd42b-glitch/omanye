-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Multi-Donor Report Builder  —  Migration 021
-- • report_templates table with per-donor section/branding overrides
-- • ALTER reports: donor_id, template_id, overrides columns
-- • Default template seeding (R7): function + AFTER INSERT trigger on orgs
-- ─────────────────────────────────────────────────────────────────────────────

-- ── report_templates ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.report_templates (
  id              UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID             NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  donor_id        UUID             REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = org-level default
  template_name   TEXT             NOT NULL,
  report_type     public.report_type NOT NULL,
  -- sections: array of { section_key, included, detail_level, custom_label?, order }
  -- detail_level: 'summary' | 'standard' | 'detailed'
  sections        JSONB            NOT NULL DEFAULT '[]'::jsonb,
  -- branding: { primary_color?, accent_color?, logo_url? }
  branding        JSONB            NOT NULL DEFAULT '{}'::jsonb,
  is_default      BOOLEAN          NOT NULL DEFAULT false,
  created_by      UUID             REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- Unique: one template per (org, donor_or_sentinel, report_type).
-- NULL donor_id uses the nil UUID so the index treats "no donor" as one slot.
CREATE UNIQUE INDEX IF NOT EXISTS report_templates_org_donor_type_uniq
  ON public.report_templates (
    organization_id,
    COALESCE(donor_id, '00000000-0000-0000-0000-000000000000'::uuid),
    report_type
  );

CREATE INDEX IF NOT EXISTS idx_report_templates_org   ON public.report_templates (organization_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_donor ON public.report_templates (donor_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_report_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER trg_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_report_templates_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ngo_read_report_templates" ON public.report_templates;
CREATE POLICY "ngo_read_report_templates"
  ON public.report_templates FOR SELECT
  USING (public.is_ngo_member(organization_id));

DROP POLICY IF EXISTS "ngo_admin_insert_report_templates" ON public.report_templates;
CREATE POLICY "ngo_admin_insert_report_templates"
  ON public.report_templates FOR INSERT
  WITH CHECK (public.is_ngo_admin(organization_id));

DROP POLICY IF EXISTS "ngo_admin_update_report_templates" ON public.report_templates;
CREATE POLICY "ngo_admin_update_report_templates"
  ON public.report_templates FOR UPDATE
  USING  (public.is_ngo_admin(organization_id))
  WITH CHECK (public.is_ngo_admin(organization_id));

DROP POLICY IF EXISTS "ngo_admin_delete_report_templates" ON public.report_templates;
CREATE POLICY "ngo_admin_delete_report_templates"
  ON public.report_templates FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- ── Alter reports ─────────────────────────────────────────────────────────────

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS donor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS overrides   JSONB; -- one-time section overrides applied at generation time

CREATE INDEX IF NOT EXISTS idx_reports_donor ON public.reports (donor_id);

-- ── R7: Default template seeding ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.seed_default_report_templates(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  full_sections    JSONB;
  summary_sections JSONB;
BEGIN
  -- Standard set: all 7 sections, standard detail level
  full_sections := '[
    {"section_key":"EXECUTIVE_SUMMARY",  "included":true,  "detail_level":"standard","order":1},
    {"section_key":"PROGRAM_OVERVIEW",   "included":true,  "detail_level":"standard","order":2},
    {"section_key":"KEY_INDICATORS",     "included":true,  "detail_level":"standard","order":3},
    {"section_key":"BUDGET_SUMMARY",     "included":true,  "detail_level":"standard","order":4},
    {"section_key":"FIELD_DATA_SUMMARY", "included":true,  "detail_level":"standard","order":5},
    {"section_key":"CHALLENGES",         "included":true,  "detail_level":"standard","order":6},
    {"section_key":"APPENDIX",           "included":false, "detail_level":"standard","order":7}
  ]'::jsonb;

  -- Brief set: executive + overview + indicators, summary detail level
  summary_sections := '[
    {"section_key":"EXECUTIVE_SUMMARY",  "included":true,  "detail_level":"summary", "order":1},
    {"section_key":"PROGRAM_OVERVIEW",   "included":true,  "detail_level":"summary", "order":2},
    {"section_key":"KEY_INDICATORS",     "included":true,  "detail_level":"summary", "order":3},
    {"section_key":"BUDGET_SUMMARY",     "included":false, "detail_level":"standard","order":4},
    {"section_key":"FIELD_DATA_SUMMARY", "included":false, "detail_level":"standard","order":5},
    {"section_key":"CHALLENGES",         "included":false, "detail_level":"standard","order":6},
    {"section_key":"APPENDIX",           "included":false, "detail_level":"standard","order":7}
  ]'::jsonb;

  INSERT INTO public.report_templates
    (organization_id, donor_id, template_name, report_type, sections, branding, is_default)
  VALUES
    (org_id, NULL, 'Default Progress Update',  'PROGRESS',    full_sections,    '{}', true),
    (org_id, NULL, 'Default Quarterly Report', 'QUARTERLY',   full_sections,    '{}', true),
    (org_id, NULL, 'Default Annual Report',    'ANNUAL',      full_sections,    '{}', true),
    (org_id, NULL, 'Default Donor Brief',      'DONOR_BRIEF', summary_sections, '{}', true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Trigger: seed templates whenever a new organisation is created
CREATE OR REPLACE FUNCTION public.trg_seed_org_report_templates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.seed_default_report_templates(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seed_report_templates_on_org_insert ON public.organizations;
CREATE TRIGGER seed_report_templates_on_org_insert
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_seed_org_report_templates();
