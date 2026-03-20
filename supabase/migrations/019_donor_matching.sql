-- ── 019_donor_matching.sql ───────────────────────────────────────────────────
-- Donor Matching feature additions:
--   1. FUNDER_HIGH_MATCH_FOUND to notification_type enum
--   2. v_org_match_summary view for admin reporting
--
-- Note: funder_digest_enabled was already added to notification_preferences
-- in migration 016. No duplicate columns needed here.

-- ── 1. Extend notification_type enum ─────────────────────────────────────────

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'FUNDER_HIGH_MATCH_FOUND';

-- ── 2. v_org_match_summary — profile completeness view ───────────────────────
-- Calculates profile completeness for each organization across the 9 tracked
-- fields used by the donor matching system.

CREATE OR REPLACE VIEW v_org_match_summary AS
SELECT
  o.id,
  o.name,
  o.slug,
  o.created_at,

  -- Count non-empty fields (9 total)
  (
    CASE WHEN o.mission_statement      IS NOT NULL AND o.mission_statement      != '' THEN 1 ELSE 0 END +
    CASE WHEN o.founding_year          IS NOT NULL                                    THEN 1 ELSE 0 END +
    CASE WHEN o.beneficiary_types      IS NOT NULL AND array_length(o.beneficiary_types, 1)      > 0 THEN 1 ELSE 0 END +
    CASE WHEN o.past_program_summaries IS NOT NULL AND o.past_program_summaries != '' THEN 1 ELSE 0 END +
    CASE WHEN o.key_achievements       IS NOT NULL AND o.key_achievements       != '' THEN 1 ELSE 0 END +
    CASE WHEN o.focus_areas            IS NOT NULL AND array_length(o.focus_areas, 1)            > 0 THEN 1 ELSE 0 END +
    CASE WHEN o.eligible_geographies   IS NOT NULL AND array_length(o.eligible_geographies, 1)   > 0 THEN 1 ELSE 0 END +
    CASE WHEN o.program_types          IS NOT NULL AND array_length(o.program_types, 1)          > 0 THEN 1 ELSE 0 END +
    CASE WHEN o.annual_budget_range    IS NOT NULL AND o.annual_budget_range    != '' THEN 1 ELSE 0 END
  ) AS filled_fields,

  9 AS total_fields,

  ROUND(
    (
      CASE WHEN o.mission_statement      IS NOT NULL AND o.mission_statement      != '' THEN 1 ELSE 0 END +
      CASE WHEN o.founding_year          IS NOT NULL                                    THEN 1 ELSE 0 END +
      CASE WHEN o.beneficiary_types      IS NOT NULL AND array_length(o.beneficiary_types, 1)      > 0 THEN 1 ELSE 0 END +
      CASE WHEN o.past_program_summaries IS NOT NULL AND o.past_program_summaries != '' THEN 1 ELSE 0 END +
      CASE WHEN o.key_achievements       IS NOT NULL AND o.key_achievements       != '' THEN 1 ELSE 0 END +
      CASE WHEN o.focus_areas            IS NOT NULL AND array_length(o.focus_areas, 1)            > 0 THEN 1 ELSE 0 END +
      CASE WHEN o.eligible_geographies   IS NOT NULL AND array_length(o.eligible_geographies, 1)   > 0 THEN 1 ELSE 0 END +
      CASE WHEN o.program_types          IS NOT NULL AND array_length(o.program_types, 1)          > 0 THEN 1 ELSE 0 END +
      CASE WHEN o.annual_budget_range    IS NOT NULL AND o.annual_budget_range    != '' THEN 1 ELSE 0 END
    )::NUMERIC / 9 * 100
  ) AS completeness_pct,

  -- Profile tag coverage (used for matching)
  array_length(o.focus_areas, 1)          AS focus_area_count,
  array_length(o.eligible_geographies, 1) AS geography_count,
  array_length(o.program_types, 1)        AS program_type_count,
  o.annual_budget_range

FROM organizations o;
