-- ── 008_audit_notifications.sql ───────────────────────────────────────────────
-- Audit Trail + Internal Notifications + Notification Preferences

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'PROGRAM_CREATED',
    'PROGRAM_UPDATED',
    'PROGRAM_STATUS_CHANGED',
    'INDICATOR_UPDATED',
    'INDICATOR_OFF_TRACK',
    'EXPENDITURE_SUBMITTED',
    'EXPENDITURE_APPROVED',
    'EXPENDITURE_REJECTED',
    'REPORT_GENERATED',
    'REPORT_SUBMITTED',
    'FIELD_SUBMISSION_FLAGGED',
    'TEAM_MEMBER_JOINED',
    'TEAM_MEMBER_REMOVED',
    'DONOR_ACCESS_REQUESTED',
    'DONOR_ACCESS_GRANTED',
    'BUDGET_WARNING'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── audit_log ─────────────────────────────────────────────────────────────────
-- Append-only, immutable record of every significant action.
-- Service role only for insert; no updates or deletes ever.

CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name      TEXT        NOT NULL,
  actor_role      TEXT        NOT NULL,
  action          TEXT        NOT NULL,       -- e.g. "program.created"
  entity_type     TEXT,                       -- e.g. "program"
  entity_id       UUID,                       -- affected row id
  entity_name     TEXT,                       -- denormalized label
  changes         JSONB,                      -- { field: { from, to } }
  metadata        JSONB,                      -- extra context
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_org_time     ON audit_log (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor_time   ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity       ON audit_log (entity_type, entity_id);

-- ── notifications ─────────────────────────────────────────────────────────────
-- Internal NGO team notifications (distinct from donor_notifications)

CREATE TABLE IF NOT EXISTS notifications (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID                  NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_id    UUID                  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type     NOT NULL,
  title           TEXT                  NOT NULL,
  body            TEXT                  NOT NULL DEFAULT '',
  link            TEXT,
  read            BOOLEAN               NOT NULL DEFAULT FALSE,
  priority        notification_priority NOT NULL DEFAULT 'MEDIUM',
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications (recipient_id, read) WHERE read = FALSE;

-- ── notification_preferences ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications       BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_program_updates    BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_indicator_updates  BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_expenditures       BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_reports            BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_field_submissions  BOOLEAN     NOT NULL DEFAULT FALSE,
  notify_team_changes       BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_donor_activity     BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_budget_warnings    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE audit_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ── audit_log policies ────────────────────────────────────────────────────────

-- NGO_ADMIN: read all rows for their org
DROP POLICY IF EXISTS "audit_admin_read" ON audit_log;
CREATE POLICY "audit_admin_read"
  ON audit_log FOR SELECT
  USING (
    organization_id = current_user_org()
    AND current_user_role() = 'NGO_ADMIN'
  );

-- NGO_STAFF / NGO_VIEWER: read own actions OR public entity types
DROP POLICY IF EXISTS "audit_staff_read" ON audit_log;
CREATE POLICY "audit_staff_read"
  ON audit_log FOR SELECT
  USING (
    organization_id = current_user_org()
    AND current_user_role() IN ('NGO_STAFF', 'NGO_VIEWER')
    AND (
      actor_id = auth.uid()
      OR entity_type IN ('program', 'indicator', 'report')
    )
  );

-- No INSERT/UPDATE/DELETE from client — service role only
-- (RLS blocks all writes; service role bypasses RLS)

-- ── notifications policies ────────────────────────────────────────────────────

-- Recipients: read + update their own notifications
DROP POLICY IF EXISTS "notifications_recipient_select" ON notifications;
CREATE POLICY "notifications_recipient_select"
  ON notifications FOR SELECT
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_recipient_update" ON notifications;
CREATE POLICY "notifications_recipient_update"
  ON notifications FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- NGO team members can insert notifications for members of same org
DROP POLICY IF EXISTS "notifications_team_insert" ON notifications;
CREATE POLICY "notifications_team_insert"
  ON notifications FOR INSERT
  WITH CHECK (
    organization_id = current_user_org()
    AND public.is_ngo_member(organization_id)
  );

-- No deletes — archive by marking read

-- ── notification_preferences policies ─────────────────────────────────────────

DROP POLICY IF EXISTS "prefs_own" ON notification_preferences;
CREATE POLICY "prefs_own"
  ON notification_preferences FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
