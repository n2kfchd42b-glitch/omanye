-- ─────────────────────────────────────────────────────────────────────────────
-- OMANYE  —  Billing & Subscriptions  —  Migration 009
-- Run with:  supabase db push
-- Rollback:  see ROLLBACK section at bottom
-- ─────────────────────────────────────────────────────────────────────────────

-- ── New enums ─────────────────────────────────────────────────────────────────

CREATE TYPE public.billing_cycle AS ENUM (
  'MONTHLY',
  'ANNUAL'
);

CREATE TYPE public.subscription_status AS ENUM (
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'TRIALING',
  'INCOMPLETE'
);

-- ── subscriptions ─────────────────────────────────────────────────────────────

CREATE TABLE public.subscriptions (
  id                      UUID                         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID                         NOT NULL UNIQUE
                            REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT                         UNIQUE,
  stripe_subscription_id  TEXT                         UNIQUE,
  stripe_price_id         TEXT,
  plan                    public.subscription_tier     NOT NULL DEFAULT 'FREE',
  billing_cycle           public.billing_cycle         NOT NULL DEFAULT 'MONTHLY',
  status                  public.subscription_status   NOT NULL DEFAULT 'ACTIVE',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN                      NOT NULL DEFAULT FALSE,
  trial_ends_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ                  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ                  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_org     ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe  ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status  ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ── billing_events ────────────────────────────────────────────────────────────
-- Immutable log of all Stripe webhook events; used for idempotency and audit.

CREATE TABLE public.billing_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID        REFERENCES public.organizations(id) ON DELETE SET NULL,
  stripe_event_id  TEXT        NOT NULL UNIQUE,   -- idempotency key
  event_type       TEXT        NOT NULL,           -- e.g. "invoice.paid"
  payload          JSONB       NOT NULL DEFAULT '{}',
  processed        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_events_org       ON public.billing_events(organization_id);
CREATE INDEX idx_billing_events_stripe_id ON public.billing_events(stripe_event_id);
CREATE INDEX idx_billing_events_type      ON public.billing_events(event_type);
CREATE INDEX idx_billing_events_processed ON public.billing_events(processed) WHERE NOT processed;

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- ── Auto-update updated_at on subscriptions ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_subscriptions_updated_at();

-- ── Auto-create FREE subscription on org creation ────────────────────────────

CREATE OR REPLACE FUNCTION public.create_default_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (NEW.id, 'FREE', 'ACTIVE')
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_create_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_default_subscription();

-- ── Backfill: create FREE subscription rows for existing orgs ─────────────────

INSERT INTO public.subscriptions (organization_id, plan, status)
SELECT id, 'FREE'::public.subscription_tier, 'ACTIVE'::public.subscription_status
FROM   public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- ── subscriptions ─────────────────────────────────────────────────────────────

-- NGO_ADMIN can read their own org's subscription
CREATE POLICY "ngo_admin_select_subscription"
  ON public.subscriptions FOR SELECT
  USING (
    organization_id = public.current_user_org()
    AND public.current_user_role() IN ('NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER')
  );

-- Only service role can write (webhook updates, no user mutations)
-- (No INSERT/UPDATE/DELETE policies for authenticated role — service role bypasses RLS)

-- ── billing_events ────────────────────────────────────────────────────────────

-- No user-facing read access; service role only
-- (No policies created — all reads/writes via service role which bypasses RLS)

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
-- ─────────────────────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
-- DROP TRIGGER IF EXISTS trg_org_create_subscription  ON public.organizations;
-- DROP FUNCTION  IF EXISTS public.set_subscriptions_updated_at();
-- DROP FUNCTION  IF EXISTS public.create_default_subscription();
-- DROP TABLE     IF EXISTS public.billing_events;
-- DROP TABLE     IF EXISTS public.subscriptions;
-- DROP TYPE      IF EXISTS public.subscription_status;
-- DROP TYPE      IF EXISTS public.billing_cycle;
