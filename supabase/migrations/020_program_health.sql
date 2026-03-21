-- ── 020_program_health.sql ────────────────────────────────────────────────────
-- Program Health Score feature:
--   1. expected_submission_cadence_per_week column on programs
--   2. program_health_scores table (append-only, full history)
--   3. Indexes and RLS

-- ── 1. Per-program submission cadence config ──────────────────────────────────

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS expected_submission_cadence_per_week
    NUMERIC CHECK (expected_submission_cadence_per_week IS NULL OR expected_submission_cadence_per_week >= 0)
    DEFAULT 2;

-- ── 2. program_health_scores ──────────────────────────────────────────────────
-- Append-only. Scores are never updated; new rows are inserted on each run,
-- preserving full history for trend charts.

CREATE TABLE IF NOT EXISTS program_health_scores (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id           UUID         NOT NULL REFERENCES programs(id)      ON DELETE CASCADE,
  organization_id      UUID         NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  composite_score      INTEGER      NOT NULL CHECK (composite_score      BETWEEN 0 AND 100),
  budget_score         INTEGER      NOT NULL CHECK (budget_score         BETWEEN 0 AND 33),
  indicator_score      INTEGER      NOT NULL CHECK (indicator_score      BETWEEN 0 AND 33),
  field_activity_score INTEGER      NOT NULL CHECK (field_activity_score BETWEEN 0 AND 33),
  rag_status           TEXT         NOT NULL CHECK (rag_status IN ('green', 'amber', 'red')),
  score_factors        JSONB        NOT NULL DEFAULT '[]',
  calculated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── 3. Indexes ────────────────────────────────────────────────────────────────

-- History queries: latest scores per program, trend charts
CREATE INDEX IF NOT EXISTS idx_health_scores_program_time
  ON program_health_scores (program_id, calculated_at DESC);

-- Dashboard RAG summary queries
CREATE INDEX IF NOT EXISTS idx_health_scores_org_rag
  ON program_health_scores (organization_id, rag_status, calculated_at DESC);

-- Org-wide trend queries
CREATE INDEX IF NOT EXISTS idx_health_scores_org_time
  ON program_health_scores (organization_id, calculated_at DESC);

-- ── 4. Row-Level Security ─────────────────────────────────────────────────────

ALTER TABLE program_health_scores ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's health scores
DROP POLICY IF EXISTS health_scores_select ON program_health_scores;
CREATE POLICY health_scores_select ON program_health_scores
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- No direct inserts from the client — only the service role and API routes insert
-- (RLS is bypassed by the service role used in API routes and edge functions)
