-- ── 018_impact_estimates.sql ────────────────────────────────────────────────
-- Impact Estimates table for the deterministic Impact Estimator feature.
-- Stores each calculation run with its inputs, results, and benchmark snapshot.

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS impact_estimates (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id          UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  program_id               UUID         REFERENCES programs(id) ON DELETE SET NULL,
  program_type             TEXT         NOT NULL,
  geography_region         TEXT         NOT NULL,
  total_budget             NUMERIC      NOT NULL CHECK (total_budget > 0),
  currency                 TEXT         NOT NULL DEFAULT 'USD',
  duration_months          INTEGER      NOT NULL CHECK (duration_months > 0),
  target_beneficiary_count INTEGER,
  notes                    TEXT,
  results                  JSONB        NOT NULL,  -- full ImpactResult snapshot
  benchmark_used           JSONB        NOT NULL,  -- BenchmarkEntry snapshot at time of calc
  confidence_level         TEXT         NOT NULL CHECK (confidence_level IN ('high', 'moderate')),
  created_by               UUID         NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_impact_estimates_org_id
  ON impact_estimates (organization_id);

CREATE INDEX IF NOT EXISTS idx_impact_estimates_org_created
  ON impact_estimates (organization_id, created_at DESC);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE impact_estimates ENABLE ROW LEVEL SECURITY;

-- NGO members can view estimates for their own organization
CREATE POLICY "org_members_can_view_impact_estimates"
  ON impact_estimates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- NGO_ADMIN and NGO_STAFF can create estimates
CREATE POLICY "org_staff_can_insert_impact_estimates"
  ON impact_estimates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('NGO_ADMIN', 'NGO_STAFF')
    )
    AND created_by = auth.uid()
  );

-- No direct updates or deletes (immutable records)
