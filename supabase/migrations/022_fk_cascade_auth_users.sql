-- Migration: add ON DELETE CASCADE to all foreign keys referencing auth.users
-- Drops and recreates each FK with CASCADE so that deleting a user automatically
-- removes related rows instead of blocking or orphaning them.

-- funder_saved_opportunities.saved_by
ALTER TABLE public.funder_saved_opportunities
  DROP CONSTRAINT IF EXISTS funder_saved_opportunities_saved_by_fkey,
  ADD  CONSTRAINT funder_saved_opportunities_saved_by_fkey
       FOREIGN KEY (saved_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- grants.created_by
ALTER TABLE public.grants
  DROP CONSTRAINT IF EXISTS grants_created_by_fkey,
  ADD  CONSTRAINT grants_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- grant_versions.generated_by
ALTER TABLE public.grant_versions
  DROP CONSTRAINT IF EXISTS grant_versions_generated_by_fkey,
  ADD  CONSTRAINT grant_versions_generated_by_fkey
       FOREIGN KEY (generated_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- impact_estimates.created_by
ALTER TABLE public.impact_estimates
  DROP CONSTRAINT IF EXISTS impact_estimates_created_by_fkey,
  ADD  CONSTRAINT impact_estimates_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- report_templates.created_by
ALTER TABLE public.report_templates
  DROP CONSTRAINT IF EXISTS report_templates_created_by_fkey,
  ADD  CONSTRAINT report_templates_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
