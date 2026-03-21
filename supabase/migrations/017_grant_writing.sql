-- ── Migration 017: Grant Writing Assistant ────────────────────────────────────
-- 1. Grant profile columns on organizations table
-- 2. grant_status enum
-- 3. grants table
-- 4. grant_versions table
-- 5. Indexes
-- 6. RLS policies
-- 7. updated_at triggers

-- ── 1. Grant profile columns on organizations ─────────────────────────────────

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mission_statement       TEXT,
  ADD COLUMN IF NOT EXISTS founding_year           INTEGER CHECK (
    founding_year IS NULL OR (founding_year >= 1900 AND founding_year <= EXTRACT(YEAR FROM NOW())::INTEGER)
  ),
  ADD COLUMN IF NOT EXISTS beneficiary_types       TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS past_program_summaries  TEXT,
  ADD COLUMN IF NOT EXISTS key_achievements        TEXT,
  ADD COLUMN IF NOT EXISTS typical_budget_range    TEXT;

-- ── 2. grant_status enum ──────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE grant_status AS ENUM ('draft', 'submitted', 'awarded', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. grants table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grants (
  id                        UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID          NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  program_id                UUID          REFERENCES programs(id) ON DELETE SET NULL,
  funder_name               TEXT          NOT NULL,
  opportunity_title         TEXT          NOT NULL,
  funding_amount_requested  NUMERIC       NOT NULL,
  currency                  TEXT          NOT NULL DEFAULT 'USD',
  application_deadline      DATE,
  status                    grant_status  NOT NULL DEFAULT 'draft',
  current_version           INTEGER       NOT NULL DEFAULT 1,
  created_by                UUID          NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 4. grant_versions table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS grant_versions (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id            UUID          NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  version_number      INTEGER       NOT NULL,
  content             JSONB         NOT NULL DEFAULT '{}',
  generation_inputs   JSONB         NOT NULL DEFAULT '{}',
  generated_by        UUID          NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_grant_version UNIQUE (grant_id, version_number)
);

-- ── 5. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_grants_org_id
  ON grants(organization_id);

CREATE INDEX IF NOT EXISTS idx_grants_status
  ON grants(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_grants_deadline
  ON grants(application_deadline);

CREATE INDEX IF NOT EXISTS idx_grant_versions_grant_id
  ON grant_versions(grant_id);

-- ── 6. RLS policies ───────────────────────────────────────────────────────────

ALTER TABLE grants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_versions ENABLE ROW LEVEL SECURITY;

-- grants: org members can select
DROP POLICY IF EXISTS grants_select ON grants;
CREATE POLICY grants_select ON grants
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- grants: org members can insert
DROP POLICY IF EXISTS grants_insert ON grants;
CREATE POLICY grants_insert ON grants
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- grants: org members can update
DROP POLICY IF EXISTS grants_update ON grants;
CREATE POLICY grants_update ON grants
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- grants: org admin can delete draft grants
DROP POLICY IF EXISTS grants_delete ON grants;
CREATE POLICY grants_delete ON grants
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles
       WHERE id = auth.uid() AND role = 'NGO_ADMIN'
    )
    AND status = 'draft'
  );

-- grant_versions: readable by org members via the parent grant
DROP POLICY IF EXISTS grant_versions_select ON grant_versions;
CREATE POLICY grant_versions_select ON grant_versions
  FOR SELECT
  USING (
    grant_id IN (
      SELECT id FROM grants
       WHERE organization_id IN (
         SELECT organization_id FROM profiles WHERE id = auth.uid()
       )
    )
  );

-- grant_versions: insertable by org members
DROP POLICY IF EXISTS grant_versions_insert ON grant_versions;
CREATE POLICY grant_versions_insert ON grant_versions
  FOR INSERT
  WITH CHECK (
    grant_id IN (
      SELECT id FROM grants
       WHERE organization_id IN (
         SELECT organization_id FROM profiles WHERE id = auth.uid()
       )
    )
    AND generated_by = auth.uid()
  );

-- ── 7. updated_at triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_grants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_grants_updated_at ON grants;
CREATE TRIGGER trg_grants_updated_at
  BEFORE UPDATE ON grants
  FOR EACH ROW EXECUTE FUNCTION update_grants_updated_at();
