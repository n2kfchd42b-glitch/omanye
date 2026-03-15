-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Auth, Roles & Donor Access  —  Migration 001
-- Run with:  supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE public.omanye_role AS ENUM (
  'NGO_ADMIN',
  'NGO_STAFF',
  'NGO_VIEWER',
  'DONOR'
);

CREATE TYPE public.subscription_tier AS ENUM (
  'FREE',
  'STARTER',
  'PROFESSIONAL',
  'ENTERPRISE'
);

CREATE TYPE public.program_status AS ENUM (
  'PLANNING',
  'ACTIVE',
  'COMPLETED',
  'SUSPENDED'
);

CREATE TYPE public.access_level AS ENUM (
  'SUMMARY_ONLY',           -- program overview + narrative only
  'INDICATORS',             -- + KPI progress
  'INDICATORS_AND_BUDGET',  -- + budget burn rate
  'FULL'                    -- everything not explicitly hidden by NGO
);

CREATE TYPE public.request_status AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED'
);

-- ── Shared trigger: keep updated_at current ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── organizations ─────────────────────────────────────────────────────────────
-- One row per NGO. NGO_ADMIN owns it; other staff belong to it via profiles.

CREATE TABLE public.organizations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,
  slug                TEXT        UNIQUE NOT NULL,   -- e.g. healthbridge-ghana
  logo_url            TEXT,
  country             TEXT,
  registration_number TEXT,
  website             TEXT,
  description         TEXT,
  subscription_tier   public.subscription_tier NOT NULL DEFAULT 'FREE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Extends auth.users. One row per user regardless of role.
-- DONOR accounts have organization_id = NULL; they link via donor_program_access.

CREATE TABLE public.profiles (
  id                  UUID              PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name           TEXT,
  avatar_url          TEXT,
  role                public.omanye_role NOT NULL,
  organization_id     UUID              REFERENCES public.organizations(id) ON DELETE SET NULL,
  job_title           TEXT,
  onboarding_complete BOOLEAN           NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ── donor_profiles ────────────────────────────────────────────────────────────
-- Extra fields only for DONOR accounts.

CREATE TABLE public.donor_profiles (
  id                UUID  PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name TEXT,                  -- the funder org, e.g. "GIZ", "USAID"
  contact_email     TEXT,
  website           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;

-- ── programs ──────────────────────────────────────────────────────────────────
-- Defined here to support access-control joins; detailed fields live in app layer.

CREATE TABLE public.programs (
  id              UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID                 NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT                 NOT NULL,
  status          public.program_status NOT NULL DEFAULT 'PLANNING',
  created_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- ── donor_program_access ──────────────────────────────────────────────────────
-- Core of the donor model. Each row = "this donor may see this program at this level".
-- NGO_ADMIN grants access; access can be time-limited via expires_at.

CREATE TABLE public.donor_program_access (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id             UUID              NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  program_id           UUID              NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id      UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  granted_by           UUID              NOT NULL REFERENCES public.profiles(id),
  access_level         public.access_level NOT NULL DEFAULT 'SUMMARY_ONLY',
  can_download_reports BOOLEAN           NOT NULL DEFAULT FALSE,
  active               BOOLEAN           NOT NULL DEFAULT TRUE,
  granted_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  expires_at           TIMESTAMPTZ,                -- NULL = no expiry
  UNIQUE (donor_id, program_id)
);

ALTER TABLE public.donor_program_access ENABLE ROW LEVEL SECURITY;

-- ── donor_access_requests ─────────────────────────────────────────────────────
-- Donors request access; NGO_ADMIN approves or denies.

CREATE TABLE public.donor_access_requests (
  id                     UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id               UUID                  NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  program_id             UUID                  NOT NULL REFERENCES public.programs(id)      ON DELETE CASCADE,
  organization_id        UUID                  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_access_level public.access_level   NOT NULL,
  message                TEXT,
  status                 public.request_status NOT NULL DEFAULT 'PENDING',
  reviewed_by            UUID                  REFERENCES public.profiles(id),
  reviewed_at            TIMESTAMPTZ,
  response_message       TEXT,
  created_at             TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

ALTER TABLE public.donor_access_requests ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX idx_profiles_organization_id          ON public.profiles(organization_id);
CREATE INDEX idx_profiles_role                     ON public.profiles(role);
CREATE INDEX idx_programs_organization_id          ON public.programs(organization_id);
CREATE INDEX idx_dpa_donor_id                      ON public.donor_program_access(donor_id);
CREATE INDEX idx_dpa_program_id                    ON public.donor_program_access(program_id);
CREATE INDEX idx_dpa_organization_id               ON public.donor_program_access(organization_id);
CREATE INDEX idx_dar_donor_id                      ON public.donor_access_requests(donor_id);
CREATE INDEX idx_dar_organization_id               ON public.donor_access_requests(organization_id);
CREATE INDEX idx_dar_status                        ON public.donor_access_requests(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions  (SECURITY DEFINER so policies stay lean)
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns the calling user's role.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.omanye_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Returns the calling user's organization_id.
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- TRUE if the calling user is an NGO member (any role) of the given org.
CREATE OR REPLACE FUNCTION public.is_ngo_member(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE  id = auth.uid()
    AND    organization_id = org_id
    AND    role IN ('NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER')
  );
$$;

-- TRUE if the calling user is the NGO_ADMIN of the given org.
CREATE OR REPLACE FUNCTION public.is_ngo_admin(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE  id = auth.uid()
    AND    organization_id = org_id
    AND    role = 'NGO_ADMIN'
  );
$$;

-- TRUE if the calling user is NGO_ADMIN or NGO_STAFF of the given org.
CREATE OR REPLACE FUNCTION public.is_ngo_editor(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE  id = auth.uid()
    AND    organization_id = org_id
    AND    role IN ('NGO_ADMIN', 'NGO_STAFF')
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── organizations ──────────────────────────────────────────────────────────

-- Any NGO member can read their own org row.
CREATE POLICY "ngo_members_select_own_org"
  ON public.organizations FOR SELECT
  USING (public.is_ngo_member(id));

-- NGO_ADMIN can update their own org.
CREATE POLICY "ngo_admin_update_org"
  ON public.organizations FOR UPDATE
  USING (public.is_ngo_admin(id));

-- ── profiles ───────────────────────────────────────────────────────────────

-- Every authenticated user can read their own profile.
CREATE POLICY "users_select_own_profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- NGO members can read all profiles within their org.
CREATE POLICY "ngo_members_select_org_profiles"
  ON public.profiles FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER')
  );

-- Users can update their own profile (name, avatar, job_title, etc.).
CREATE POLICY "users_update_own_profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Signup inserts are handled via service-role in server actions.
-- This policy allows the signed-in user to insert their own row if needed.
CREATE POLICY "users_insert_own_profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── donor_profiles ─────────────────────────────────────────────────────────

CREATE POLICY "donors_select_own"
  ON public.donor_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "donors_update_own"
  ON public.donor_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "donors_insert_own"
  ON public.donor_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- NGO_ADMIN can read donor profiles for donors with access to their programs.
CREATE POLICY "ngo_admin_select_donor_profiles"
  ON public.donor_profiles FOR SELECT
  USING (
    public.current_user_role() = 'NGO_ADMIN'
    AND EXISTS (
      SELECT 1 FROM public.donor_program_access dpa
      WHERE dpa.donor_id = donor_profiles.id
      AND   dpa.organization_id = public.current_user_org()
    )
  );

-- ── programs ───────────────────────────────────────────────────────────────

-- NGO members can read all programs belonging to their org.
CREATE POLICY "ngo_members_select_programs"
  ON public.programs FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN and NGO_STAFF can create programs.
CREATE POLICY "ngo_editors_insert_programs"
  ON public.programs FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF')
  );

-- NGO_ADMIN and NGO_STAFF can update programs.
CREATE POLICY "ngo_editors_update_programs"
  ON public.programs FOR UPDATE
  USING (public.is_ngo_editor(organization_id));

-- Only NGO_ADMIN can delete programs.
CREATE POLICY "ngo_admin_delete_programs"
  ON public.programs FOR DELETE
  USING (public.is_ngo_admin(organization_id));

-- Donors see only programs where they have an active, non-expired access grant.
CREATE POLICY "donors_select_accessible_programs"
  ON public.programs FOR SELECT
  USING (
    public.current_user_role() = 'DONOR'
    AND EXISTS (
      SELECT 1 FROM public.donor_program_access dpa
      WHERE  dpa.program_id = programs.id
      AND    dpa.donor_id   = auth.uid()
      AND    dpa.active     = TRUE
      AND    (dpa.expires_at IS NULL OR dpa.expires_at > NOW())
    )
  );

-- ── donor_program_access ───────────────────────────────────────────────────

-- Donors can read their own access grants.
CREATE POLICY "donors_select_own_access"
  ON public.donor_program_access FOR SELECT
  USING (donor_id = auth.uid());

-- NGO members can read access grants for their org.
CREATE POLICY "ngo_members_select_access_grants"
  ON public.donor_program_access FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- Only NGO_ADMIN can grant access.
CREATE POLICY "ngo_admin_insert_access"
  ON public.donor_program_access FOR INSERT
  WITH CHECK (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

-- Only NGO_ADMIN can modify access grants (e.g. change level or revoke).
CREATE POLICY "ngo_admin_update_access"
  ON public.donor_program_access FOR UPDATE
  USING (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

CREATE POLICY "ngo_admin_delete_access"
  ON public.donor_program_access FOR DELETE
  USING (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );

-- ── donor_access_requests ──────────────────────────────────────────────────

-- Donors can read their own requests.
CREATE POLICY "donors_select_own_requests"
  ON public.donor_access_requests FOR SELECT
  USING (donor_id = auth.uid());

-- Donors can submit new access requests.
CREATE POLICY "donors_insert_requests"
  ON public.donor_access_requests FOR INSERT
  WITH CHECK (
    donor_id = auth.uid()
    AND public.current_user_role() = 'DONOR'
  );

-- NGO members can read access requests for their org.
CREATE POLICY "ngo_members_select_requests"
  ON public.donor_access_requests FOR SELECT
  USING (public.is_ngo_member(organization_id));

-- NGO_ADMIN can approve or deny requests.
CREATE POLICY "ngo_admin_update_requests"
  ON public.donor_access_requests FOR UPDATE
  USING (
    organization_id = public.current_user_org()
    AND public.current_user_role() = 'NGO_ADMIN'
  );
