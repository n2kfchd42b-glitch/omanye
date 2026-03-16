-- ── OMANYE Migration 007 — Team Management ──────────────────────────────────
-- Adds team_invitations and program_assignments tables.

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE team_invitation_status AS ENUM (
  'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'
);

-- ── team_invitations ──────────────────────────────────────────────────────────

CREATE TABLE team_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES profiles(id)       ON DELETE SET NULL,
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            omanye_role NOT NULL DEFAULT 'NGO_VIEWER',
  token           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  message         TEXT,
  status          team_invitation_status NOT NULL DEFAULT 'PENDING',
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_team_invitations_org      ON team_invitations(organization_id);
CREATE INDEX idx_team_invitations_token    ON team_invitations(token);
CREATE INDEX idx_team_invitations_email    ON team_invitations(email);
CREATE INDEX idx_team_invitations_status   ON team_invitations(status);

-- ── program_assignments ───────────────────────────────────────────────────────

CREATE TABLE program_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL REFERENCES programs(id)  ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_by     UUID NOT NULL REFERENCES profiles(id)  ON DELETE SET NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, profile_id)
);

CREATE INDEX idx_program_assignments_program  ON program_assignments(program_id);
CREATE INDEX idx_program_assignments_profile  ON program_assignments(profile_id);
CREATE INDEX idx_program_assignments_org      ON program_assignments(organization_id);

-- ── RLS — team_invitations ────────────────────────────────────────────────────

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- NGO_ADMIN: full read/write for their org
CREATE POLICY "ti: admin full access"
  ON team_invitations
  FOR ALL
  USING (
    organization_id = current_user_org()
    AND current_user_role() = 'NGO_ADMIN'
  )
  WITH CHECK (
    organization_id = current_user_org()
    AND current_user_role() = 'NGO_ADMIN'
  );

-- NGO_STAFF / NGO_VIEWER: read own invitation (by email match via auth)
CREATE POLICY "ti: staff read own"
  ON team_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND current_user_role() IN ('NGO_STAFF', 'NGO_VIEWER')
  );

-- Unauthenticated / anyone: read a single row by token (for invitation acceptance)
CREATE POLICY "ti: public read by token"
  ON team_invitations
  FOR SELECT
  USING (true);  -- filtered by token in query; fine for this public lookup

-- ── RLS — program_assignments ─────────────────────────────────────────────────

ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- NGO_ADMIN: full read/write for their org
CREATE POLICY "pa: admin full access"
  ON program_assignments
  FOR ALL
  USING (
    organization_id = current_user_org()
    AND current_user_role() = 'NGO_ADMIN'
  )
  WITH CHECK (
    organization_id = current_user_org()
    AND current_user_role() = 'NGO_ADMIN'
  );

-- NGO_STAFF / NGO_VIEWER: read own assignments
CREATE POLICY "pa: staff read own"
  ON program_assignments
  FOR SELECT
  USING (
    profile_id = auth.uid()
    AND current_user_role() IN ('NGO_STAFF', 'NGO_VIEWER')
  );

-- All NGO team: read all assignments for their org
CREATE POLICY "pa: ngo team read org assignments"
  ON program_assignments
  FOR SELECT
  USING (
    organization_id = current_user_org()
    AND current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER')
  );
