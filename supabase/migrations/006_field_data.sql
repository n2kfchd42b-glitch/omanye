-- ── 006_field_data.sql ────────────────────────────────────────────────────────
-- Field Data Collection & M&E tables

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'FLAGGED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── field_collection_forms ────────────────────────────────────────────────────
-- NGO defines what field staff collect

CREATE TABLE IF NOT EXISTS field_collection_forms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text NOT NULL DEFAULT '',
  fields          jsonb NOT NULL DEFAULT '[]',
  active          boolean NOT NULL DEFAULT true,
  created_by      uuid NOT NULL REFERENCES profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_forms_program    ON field_collection_forms(program_id);
CREATE INDEX IF NOT EXISTS idx_field_forms_org        ON field_collection_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_field_forms_active     ON field_collection_forms(active);

-- ── field_submissions ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS field_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  submitted_by    uuid NOT NULL REFERENCES profiles(id),
  form_id         uuid REFERENCES field_collection_forms(id) ON DELETE SET NULL,
  submission_date date NOT NULL DEFAULT CURRENT_DATE,
  location_name   text NOT NULL DEFAULT '',
  location_lat    numeric,
  location_lng    numeric,
  data            jsonb NOT NULL DEFAULT '{}',
  notes           text NOT NULL DEFAULT '',
  attachments     jsonb NOT NULL DEFAULT '[]',
  status          submission_status NOT NULL DEFAULT 'SUBMITTED',
  reviewed_by     uuid REFERENCES profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_field_submissions_program  ON field_submissions(program_id);
CREATE INDEX IF NOT EXISTS idx_field_submissions_org      ON field_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_field_submissions_by       ON field_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_field_submissions_status   ON field_submissions(status);
CREATE INDEX IF NOT EXISTS idx_field_submissions_date     ON field_submissions(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_field_submissions_form     ON field_submissions(form_id);

-- ── Updated-at triggers ───────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_field_forms_updated_at ON field_collection_forms;
CREATE TRIGGER trg_field_forms_updated_at
  BEFORE UPDATE ON field_collection_forms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_field_submissions_updated_at ON field_submissions;
CREATE TRIGGER trg_field_submissions_updated_at
  BEFORE UPDATE ON field_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE field_collection_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_submissions       ENABLE ROW LEVEL SECURITY;

-- field_collection_forms policies
-- NGO members can read forms for their org
DROP POLICY IF EXISTS "ngo_read_forms" ON field_collection_forms;
CREATE POLICY "ngo_read_forms" ON field_collection_forms
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- NGO_ADMIN can insert / update / delete forms
DROP POLICY IF EXISTS "ngo_admin_write_forms" ON field_collection_forms;
CREATE POLICY "ngo_admin_write_forms" ON field_collection_forms
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'NGO_ADMIN'
    )
  );

-- field_submissions policies
-- NGO members can read all submissions for their org
DROP POLICY IF EXISTS "ngo_read_submissions" ON field_submissions;
CREATE POLICY "ngo_read_submissions" ON field_submissions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- NGO_STAFF and NGO_ADMIN can insert submissions
DROP POLICY IF EXISTS "ngo_staff_insert_submissions" ON field_submissions;
CREATE POLICY "ngo_staff_insert_submissions" ON field_submissions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('NGO_ADMIN', 'NGO_STAFF')
    )
  );

-- NGO_ADMIN can update submissions (for review / flag)
DROP POLICY IF EXISTS "ngo_admin_update_submissions" ON field_submissions;
CREATE POLICY "ngo_admin_update_submissions" ON field_submissions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role = 'NGO_ADMIN'
    )
  );

-- NGO_STAFF can update their own DRAFT submissions
DROP POLICY IF EXISTS "ngo_staff_update_own_draft" ON field_submissions;
CREATE POLICY "ngo_staff_update_own_draft" ON field_submissions
  FOR UPDATE USING (
    submitted_by = auth.uid() AND status = 'DRAFT'
  );

-- NOTE: Donors have NO access to raw field_submissions (enforced by absence of donor policy)
