-- ── Migration 016: Org Profile Tags + Funder Saved Opportunities ──────────────
-- Adds NGO profile tag fields to organizations table (used for funder matching).
-- Creates funder_saved_opportunities table for bookmarked grant opportunities.
-- Adds funder_digest_enabled flag to notification_preferences.

-- ── 1. Org profile tag columns ────────────────────────────────────────────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS focus_areas           TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS eligible_geographies  TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS program_types         TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS annual_budget_range   TEXT    CHECK (
    annual_budget_range IS NULL OR annual_budget_range IN (
      'under_100k', '100k_500k', '500k_1m', '1m_5m', 'above_5m'
    )
  );

-- GIN indexes for array overlap queries
CREATE INDEX IF NOT EXISTS idx_orgs_focus_areas
  ON organizations USING GIN(focus_areas);

CREATE INDEX IF NOT EXISTS idx_orgs_geographies
  ON organizations USING GIN(eligible_geographies);

CREATE INDEX IF NOT EXISTS idx_orgs_program_types
  ON organizations USING GIN(program_types);

-- ── 2. funder_save_status enum ────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE funder_save_status AS ENUM ('saved', 'applied', 'declined');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. funder_saved_opportunities table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS funder_saved_opportunities (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID            NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id  UUID            NOT NULL REFERENCES funder_opportunities(id) ON DELETE CASCADE,
  saved_by        UUID            NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status          funder_save_status NOT NULL DEFAULT 'saved',
  notes           TEXT,
  saved_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_org_opportunity UNIQUE (organization_id, opportunity_id)
);

CREATE INDEX IF NOT EXISTS idx_funder_saved_org
  ON funder_saved_opportunities(organization_id);

CREATE INDEX IF NOT EXISTS idx_funder_saved_status
  ON funder_saved_opportunities(organization_id, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_funder_saved_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_funder_saved_updated_at ON funder_saved_opportunities;
CREATE TRIGGER trg_funder_saved_updated_at
  BEFORE UPDATE ON funder_saved_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_funder_saved_updated_at();

-- ── 4. RLS on funder_saved_opportunities ─────────────────────────────────────

ALTER TABLE funder_saved_opportunities ENABLE ROW LEVEL SECURITY;

-- Members of the org can view their org's saved opportunities
DROP POLICY IF EXISTS funder_saved_select ON funder_saved_opportunities;
CREATE POLICY funder_saved_select ON funder_saved_opportunities
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Members of the org can insert saves
DROP POLICY IF EXISTS funder_saved_insert ON funder_saved_opportunities;
CREATE POLICY funder_saved_insert ON funder_saved_opportunities
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND saved_by = auth.uid()
  );

-- Members of the org can update their saved records
DROP POLICY IF EXISTS funder_saved_update ON funder_saved_opportunities;
CREATE POLICY funder_saved_update ON funder_saved_opportunities
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Members of the org can delete their saved records
DROP POLICY IF EXISTS funder_saved_delete ON funder_saved_opportunities;
CREATE POLICY funder_saved_delete ON funder_saved_opportunities
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── 5. funder_digest_enabled on notification_preferences ─────────────────────

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS funder_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE;
