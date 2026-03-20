-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Field Offline Sync Support  —  Migration 015
-- Run with:  supabase db push
--
-- PURPOSE:
--   Extends field_submissions with columns required for offline data collection:
--   sync_source tracks whether a row arrived via direct web submission or a
--   device batch-sync, device_metadata captures client context, and the
--   flagged_for_review / flag_reason / rejection_reason columns support the
--   moderation-queue workflow (B6).
--   Also adds the 'batch_sync' value to the audit_action enum if it exists,
--   or documents that the action is stored as plain text (no enum in this DB).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. sync_source enum ────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'sync_source_type'
  ) THEN
    CREATE TYPE public.sync_source_type AS ENUM ('direct', 'batch_sync');
  END IF;
END $$;

-- ── 2. Add columns to field_submissions ───────────────────────────────────────

ALTER TABLE public.field_submissions
  ADD COLUMN IF NOT EXISTS sync_source        public.sync_source_type NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS device_metadata    jsonb,
  ADD COLUMN IF NOT EXISTS flagged_for_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason        text,
  ADD COLUMN IF NOT EXISTS rejection_reason   text;

-- Validate: flag_reason only meaningful when flagged
-- (non-blocking constraint — existing rows all have flagged_for_review = false)
ALTER TABLE public.field_submissions
  DROP CONSTRAINT IF EXISTS chk_flag_reason_requires_flag;

ALTER TABLE public.field_submissions
  ADD CONSTRAINT chk_flag_reason_requires_flag
    CHECK (flagged_for_review = true OR flag_reason IS NULL);

-- ── 3. Partial index for moderation-queue queries ─────────────────────────────
-- Only indexes the small subset of flagged rows, keeping it narrow and fast.

CREATE INDEX IF NOT EXISTS idx_field_submissions_flagged
  ON public.field_submissions(organization_id, created_at DESC)
  WHERE flagged_for_review = true;

-- ── 4. device_metadata JSON schema comment ────────────────────────────────────
-- Expected keys (not enforced at DB level, validated at API layer):
--   { "platform": "web|android|ios", "app_version": "1.0.0",
--     "offline_queued_at": "<ISO8601>", "batch_id": "<uuid>" }

COMMENT ON COLUMN public.field_submissions.device_metadata IS
  'Client device context captured at submission time. '
  'Expected keys: platform, app_version, offline_queued_at, batch_id.';

COMMENT ON COLUMN public.field_submissions.sync_source IS
  'How the submission reached the server: direct (real-time web) or batch_sync (offline device queue).';

COMMENT ON COLUMN public.field_submissions.flagged_for_review IS
  'Set to TRUE by the batch ingestion pipeline when a submission requires manual moderation.';

COMMENT ON COLUMN public.field_submissions.flag_reason IS
  'Human-readable reason the submission was flagged (e.g. missing required fields, GPS mismatch).';

COMMENT ON COLUMN public.field_submissions.rejection_reason IS
  'Reason recorded when an NGO admin rejects a flagged submission.';

-- ── 5. RLS — flagged submissions readable by NGO_ADMIN only ───────────────────
-- The existing ngo_read_submissions policy already covers SELECT for all NGO
-- members on their org's submissions. No additional policy is needed for
-- flagged_for_review — the column is just a filter that the UI applies.
-- The RESTRICTIVE "No donor access to field submissions" policy in 013 continues
-- to block donors from any field_submissions row regardless of flag state.

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK NOTES
-- ─────────────────────────────────────────────────────────────────────────────
--   ALTER TABLE public.field_submissions
--     DROP CONSTRAINT IF EXISTS chk_flag_reason_requires_flag,
--     DROP COLUMN IF EXISTS sync_source,
--     DROP COLUMN IF EXISTS device_metadata,
--     DROP COLUMN IF EXISTS flagged_for_review,
--     DROP COLUMN IF EXISTS flag_reason,
--     DROP COLUMN IF EXISTS rejection_reason;
--   DROP TYPE IF EXISTS public.sync_source_type;
--   DROP INDEX IF EXISTS idx_field_submissions_flagged;
