-- Fix donor_invitations.invited_by FK to use ON DELETE CASCADE
-- Previously ON DELETE RESTRICT, which blocked user deletion when they had sent invitations.

ALTER TABLE public.donor_invitations
  DROP CONSTRAINT IF EXISTS donor_invitations_invited_by_fkey,
  ADD  CONSTRAINT donor_invitations_invited_by_fkey
       FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
