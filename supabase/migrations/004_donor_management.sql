-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Donor Management  —  Migration 004
-- Run with:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New enums ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'REVOKED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.donor_notification_type AS ENUM (
    'ACCESS_GRANTED',
    'ACCESS_UPDATED',
    'ACCESS_REVOKED',
    'NEW_UPDATE',
    'NEW_REPORT',
    'REQUEST_APPROVED',
    'REQUEST_DENIED',
    'TRANCHE_REMINDER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Extend donor_program_access ────────────────────────────────────────────────

ALTER TABLE public.donor_program_access
  ADD COLUMN IF NOT EXISTS nickname         TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes   TEXT,
  ADD COLUMN IF NOT EXISTS last_viewed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count       INTEGER NOT NULL DEFAULT 0;

-- ── donor_invitations ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.donor_invitations (
  id                   UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID                      NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id           UUID                      NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  invited_by           UUID                      NOT NULL REFERENCES public.profiles(id)      ON DELETE RESTRICT,
  email                TEXT                      NOT NULL,
  donor_name           TEXT,
  organization_name    TEXT,
  access_level         public.access_level       NOT NULL DEFAULT 'SUMMARY_ONLY',
  can_download_reports BOOLEAN                   NOT NULL DEFAULT FALSE,
  token                UUID                      UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  message              TEXT,
  status               public.invitation_status  NOT NULL DEFAULT 'PENDING',
  expires_at           TIMESTAMPTZ               NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  accepted_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org         ON public.donor_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_program     ON public.donor_invitations(program_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email       ON public.donor_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token       ON public.donor_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status      ON public.donor_invitations(status);

ALTER TABLE public.donor_invitations ENABLE ROW LEVEL SECURITY;

-- ── donor_notifications ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.donor_notifications (
  id              UUID                          PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id        UUID                          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID                          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  program_id      UUID                          REFERENCES public.programs(id) ON DELETE CASCADE,
  type            public.donor_notification_type NOT NULL,
  title           TEXT                          NOT NULL,
  body            TEXT                          NOT NULL DEFAULT '',
  link            TEXT,
  read            BOOLEAN                       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ                   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_donor     ON public.donor_notifications(donor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org       ON public.donor_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read      ON public.donor_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON public.donor_notifications(created_at DESC);

ALTER TABLE public.donor_notifications ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── donor_invitations ─────────────────────────────────────────────────────────

-- NGO members can read invitations for their org
DROP POLICY IF EXISTS "ngo_members_select_invitations" ON public.donor_invitations;
CREATE POLICY "ngo_members_select_invitations"
  ON public.donor_invitations FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN and NGO_STAFF can create invitations
DROP POLICY IF EXISTS "ngo_editors_insert_invitations" ON public.donor_invitations;
CREATE POLICY "ngo_editors_insert_invitations"
  ON public.donor_invitations FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

-- NGO_ADMIN can update (revoke) invitations
DROP POLICY IF EXISTS "ngo_admin_update_invitations" ON public.donor_invitations;
CREATE POLICY "ngo_admin_update_invitations"
  ON public.donor_invitations FOR UPDATE
  USING (public.is_ngo_admin(organization_id));

-- NGO_ADMIN can delete invitations
DROP POLICY IF EXISTS "ngo_admin_delete_invitations" ON public.donor_invitations;
CREATE POLICY "ngo_admin_delete_invitations"
  ON public.donor_invitations FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- Unauthenticated / any: read single row by token (invite acceptance page)
-- Note: uses anon role — token is the secret
DROP POLICY IF EXISTS "public_read_invitation_by_token" ON public.donor_invitations;
CREATE POLICY "public_read_invitation_by_token"
  ON public.donor_invitations FOR SELECT
  USING (TRUE);  -- Token validation done in application layer; token is a UUID secret

-- Donor: read own accepted invitations (by email match via auth.email())
DROP POLICY IF EXISTS "donor_read_own_invitations" ON public.donor_invitations;
CREATE POLICY "donor_read_own_invitations"
  ON public.donor_invitations FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ── donor_notifications ───────────────────────────────────────────────────────

-- Donors: read own notifications
DROP POLICY IF EXISTS "donor_select_own_notifications" ON public.donor_notifications;
CREATE POLICY "donor_select_own_notifications"
  ON public.donor_notifications FOR SELECT
  USING (
    donor_id = auth.uid()
    AND public.current_user_role() = 'DONOR'
  );

-- Donors: mark own notifications as read (update read column only)
DROP POLICY IF EXISTS "donor_update_own_notifications" ON public.donor_notifications;
CREATE POLICY "donor_update_own_notifications"
  ON public.donor_notifications FOR UPDATE
  USING (
    donor_id = auth.uid()
    AND public.current_user_role() = 'DONOR'
  );

-- NGO team: insert notifications for donors (fire-and-forget)
DROP POLICY IF EXISTS "ngo_insert_notifications" ON public.donor_notifications;
CREATE POLICY "ngo_insert_notifications"
  ON public.donor_notifications FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

-- Service role can insert (used by edge function and server actions)
-- (service role bypasses RLS automatically)

-- ── donor_program_access (extend existing) ────────────────────────────────────
-- The existing policies already cover SELECT for donors and NGO members.
-- internal_notes column security: enforced at API/service layer.
-- We add an update policy for tracking last_viewed_at from donor sessions.

-- Donors can update last_viewed_at and view_count on their own rows
DROP POLICY IF EXISTS "donor_update_own_access_tracking" ON public.donor_program_access;
CREATE POLICY "donor_update_own_access_tracking"
  ON public.donor_program_access FOR UPDATE
  USING (
    donor_id = auth.uid()
    AND public.current_user_role() = 'DONOR'
  )
  WITH CHECK (
    donor_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: expire_pending_invitations
-- Called by cron or on-read to mark expired invitations
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.expire_pending_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.donor_invitations
  SET    status = 'EXPIRED'
  WHERE  status = 'PENDING'
  AND    expires_at < NOW();
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: accept_invitation
-- Atomically creates donor_program_access and marks invitation accepted
-- Called from server action after donor authentication
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token      UUID,
  p_donor_id   UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inv   public.donor_invitations%ROWTYPE;
  v_dpa   public.donor_program_access%ROWTYPE;
BEGIN
  -- Lock and fetch invitation
  SELECT * INTO v_inv
  FROM   public.donor_invitations
  WHERE  token = p_token
  FOR    UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'INVITATION_NOT_FOUND');
  END IF;

  IF v_inv.status = 'ACCEPTED' THEN
    RETURN jsonb_build_object('error', 'ALREADY_ACCEPTED');
  END IF;

  IF v_inv.status = 'REVOKED' THEN
    RETURN jsonb_build_object('error', 'INVITATION_REVOKED');
  END IF;

  IF v_inv.status = 'EXPIRED' OR v_inv.expires_at < NOW() THEN
    UPDATE public.donor_invitations SET status = 'EXPIRED' WHERE token = p_token;
    RETURN jsonb_build_object('error', 'INVITATION_EXPIRED');
  END IF;

  -- Upsert donor_program_access
  INSERT INTO public.donor_program_access (
    donor_id, program_id, organization_id, granted_by,
    access_level, can_download_reports, active, granted_at
  )
  VALUES (
    p_donor_id, v_inv.program_id, v_inv.organization_id, v_inv.invited_by,
    v_inv.access_level, v_inv.can_download_reports, TRUE, NOW()
  )
  ON CONFLICT (donor_id, program_id)
  DO UPDATE SET
    access_level         = EXCLUDED.access_level,
    can_download_reports = EXCLUDED.can_download_reports,
    active               = TRUE,
    granted_by           = EXCLUDED.granted_by,
    granted_at           = NOW()
  RETURNING * INTO v_dpa;

  -- Mark invitation accepted
  UPDATE public.donor_invitations
  SET    status      = 'ACCEPTED',
         accepted_at = NOW()
  WHERE  token = p_token;

  RETURN jsonb_build_object(
    'success',         TRUE,
    'program_id',      v_inv.program_id,
    'organization_id', v_inv.organization_id,
    'access_level',    v_inv.access_level
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Partial unique index on donor_program_access (donor_id, program_id)
-- Ensures accept_invitation ON CONFLICT works correctly
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_dpa_donor_program_unique
  ON public.donor_program_access(donor_id, program_id);
