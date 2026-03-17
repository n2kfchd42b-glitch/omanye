'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, X, ChevronRight } from 'lucide-react'
import { AdinkraheneWatermark } from '@/components/marketing/AdinkraheneIcon'
import { PLANS } from '@/lib/billing/plans'

// Note: metadata must live in a server component (layout.tsx for this route group)

const serif = { fontFamily: 'var(--font-fraunces),Georgia,serif' }
const sans  = { fontFamily: 'var(--font-instrument),system-ui,sans-serif' }

// ── Plan card data ────────────────────────────────────────────────────────────

const PLAN_CARDS = [
  {
    key:         'FREE' as const,
    description: 'For small NGOs getting started with transparent program management.',
    cta:         { label: 'Start Free', href: '/signup/ngo', stripe: false },
  },
  {
    key:         'STARTER' as const,
    description: 'For growing NGOs managing multiple programs and donor relationships.',
    cta:         { label: 'Start 14-day Free Trial', href: null, stripe: true },
    highlighted: true,
    badge:       'Most Popular',
  },
  {
    key:         'PROFESSIONAL' as const,
    description: 'For established NGOs that need full power, compliance, and scale.',
    cta:         { label: 'Start 14-day Free Trial', href: null, stripe: true },
  },
  {
    key:         'ENTERPRISE' as const,
    description: 'Custom plans for large NGOs, INGOs, and multi-country operations.',
    cta:         { label: 'Talk to Sales', href: '/contact', stripe: false },
  },
]

// Detailed feature comparison table
const COMPARISON_ROWS = [
  {
    category: 'Programs & Indicators',
    features: [
      { label: 'Active programs',       free: '2',    starter: '10',  pro: '50',          ent: 'Unlimited' },
      { label: 'Indicators per program', free: true,  starter: true,  pro: true,          ent: true },
      { label: 'Program updates / logs', free: true,  starter: true,  pro: true,          ent: true },
      { label: 'Off-track alerts',       free: false, starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Team & Access',
    features: [
      { label: 'Team members',           free: '3',   starter: '10',  pro: '50',          ent: 'Unlimited' },
      { label: 'Roles (Admin/Staff/Viewer)', free: true, starter: true, pro: true,        ent: true },
      { label: 'Program assignments',    free: false, starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Donor Management',
    features: [
      { label: 'Donor connections',      free: '5',   starter: '25',  pro: '100',         ent: 'Unlimited' },
      { label: 'Access levels (4-tier)', free: true,  starter: true,  pro: true,          ent: true },
      { label: 'Donor portal',           free: true,  starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Budget & Finance',
    features: [
      { label: 'Budget categories',      free: false, starter: true,  pro: true,          ent: true },
      { label: 'Expenditure logging',    free: false, starter: true,  pro: true,          ent: true },
      { label: 'Funding tranches',       free: false, starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Reporting',
    features: [
      { label: 'Reports / month',        free: '3',   starter: '20',  pro: 'Unlimited',   ent: 'Unlimited' },
      { label: 'PDF export',             free: false, starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Field Data',
    features: [
      { label: 'Field forms',            free: '1',   starter: '5',   pro: 'Unlimited',   ent: 'Unlimited' },
      { label: 'Mobile submission',      free: false, starter: true,  pro: true,          ent: true },
    ],
  },
  {
    category: 'Compliance',
    features: [
      { label: 'Audit trail',            free: false, starter: 'Read only', pro: true,    ent: true },
      { label: 'SSO / SAML',            free: false, starter: false,  pro: false,        ent: true },
      { label: 'SLA guarantee',         free: false, starter: false,  pro: false,        ent: true },
    ],
  },
]

type ColVal = boolean | string

function CellValue({ value }: { value: ColVal }) {
  if (value === true)  return <Check size={16} style={{ color: '#D4AF5C' }} className="mx-auto" />
  if (value === false) return <X     size={14} style={{ color: 'rgba(15,27,51,0.2)' }} className="mx-auto" />
  return <span className="text-sm" style={{ color: '#0F1B33', ...sans }}>{value}</span>
}

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({
  planKey, description, highlighted, badge, cta, billing, onCheckout, loading,
}: {
  planKey:     keyof typeof PLANS
  description: string
  highlighted?: boolean
  badge?:       string
  cta:         { label: string; href: string | null; stripe: boolean }
  billing:     'monthly' | 'annual'
  onCheckout:  (priceId: string) => void
  loading:     boolean
}) {
  const plan     = PLANS[planKey]
  const price    = billing === 'annual' ? plan.price_annual : plan.price_monthly
  const priceId  = billing === 'annual'
    ? plan.stripe_price_id_annual
    : plan.stripe_price_id_monthly
  const isFree       = price === 0
  const isEnterprise = price === null

  function handleCta() {
    if (!cta.stripe) return
    if (priceId) { onCheckout(priceId); return }
    // If price IDs not yet configured, fall through to /signup/ngo
    window.location.href = '/signup/ngo'
  }

  return (
    <div
      className="relative flex flex-col rounded-2xl p-6"
      style={{
        background:    highlighted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border:        highlighted ? '1px solid rgba(212,175,92,0.4)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow:     highlighted ? '0 0 40px rgba(212,175,92,0.08)' : 'none',
      }}
    >
      {badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: '#D4AF5C', color: '#0F1B33', ...sans }}
        >
          {badge}
        </span>
      )}

      <p className="text-base font-semibold mb-1" style={{ color: highlighted ? '#D4AF5C' : 'white', ...serif }}>{plan.name}</p>
      <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.45)', ...sans }}>{description}</p>

      {/* Price */}
      <div className="mb-6">
        {isEnterprise ? (
          <p className="text-2xl font-bold" style={{ color: 'white', ...serif }}>Custom</p>
        ) : (
          <>
            <span className="text-4xl font-bold" style={{ color: 'white', ...serif }}>
              {isFree ? 'Free' : `$${price}`}
            </span>
            {!isFree && (
              <span className="text-sm ml-1" style={{ color: 'rgba(255,255,255,0.4)', ...sans }}>/mo</span>
            )}
            {billing === 'annual' && !isFree && !isEnterprise && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)', ...sans }}>
                Billed ${(price! * 12)} / year
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-2 mb-8 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', ...sans }}>
            <Check size={14} style={{ color: '#D4AF5C', flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {cta.stripe ? (
        <button
          onClick={handleCta}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: highlighted ? '#D4AF5C' : 'rgba(255,255,255,0.1)',
            color:      highlighted ? '#0F1B33' : 'white',
            border:     highlighted ? 'none' : '1px solid rgba(255,255,255,0.15)',
            cursor:     loading ? 'not-allowed' : 'pointer',
            opacity:    loading ? 0.7 : 1,
            ...sans,
          }}
        >
          {loading ? 'Loading…' : cta.label}
        </button>
      ) : (
        <Link
          href={cta.href ?? '/signup/ngo'}
          className="block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all"
          style={{
            background: highlighted ? '#D4AF5C' : 'rgba(255,255,255,0.1)',
            color:      highlighted ? '#0F1B33' : 'white',
            border:     highlighted ? 'none' : '1px solid rgba(255,255,255,0.15)',
            textDecoration: 'none',
            ...sans,
          }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const router                           = useRouter()
  const [billing, setBilling]            = useState<'monthly' | 'annual'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  async function handleCheckout(priceId: string) {
    // If not logged in, send to signup; the checkout completes after auth
    setCheckoutLoading(true)
    try {
      // Try the checkout API first (will fail with 401 if not logged in)
      const res = await fetch('/api/billing/subscription')
      if (res.status === 401) {
        // Store intended plan in sessionStorage, redirect to signup
        sessionStorage.setItem('intended_price_id', priceId)
        router.push('/signup/ngo')
        return
      }
      const subData = await res.json()
      const orgId   = subData?.subscription?.organization_id
      if (!orgId) { router.push('/signup/ngo'); return }

      const checkoutRes = await fetch('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ priceId, organizationId: orgId }),
      })
      const json = await checkoutRes.json()
      if (json.url) window.location.href = json.url
      else router.push('/signup/ngo')
    } catch {
      router.push('/signup/ngo')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: '#0F1B33' }}>
        <AdinkraheneWatermark
          size={500}
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <div className="max-w-2xl mx-auto px-4 text-center relative">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF5C', ...sans }}>
            Pricing
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'white', ...serif }}>
            Simple, honest pricing
          </h1>
          <p className="text-lg mb-10" style={{ color: 'rgba(255,255,255,0.55)', ...sans }}>
            Start free. Upgrade when you&apos;re ready. No hidden fees, no per-seat surprises.
          </p>

          {/* Billing toggle */}
          <div
            className="flex rounded-xl p-1 mx-auto w-fit"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['monthly', 'annual'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="px-7 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: billing === b ? '#D4AF5C' : 'transparent',
                  color:      billing === b ? '#0F1B33' : 'rgba(255,255,255,0.6)',
                  ...sans,
                }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}
                {b === 'annual' && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: billing === 'annual' ? 'rgba(15,27,51,0.2)' : 'rgba(212,175,92,0.2)',
                      color:      billing === 'annual' ? '#0F1B33' : '#D4AF5C',
                    }}
                  >
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-16" style={{ background: '#0F1B33' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLAN_CARDS.map((card) => (
              <PlanCard
                key={card.key}
                planKey={card.key}
                description={card.description}
                highlighted={card.highlighted}
                badge={card.badge}
                cta={card.cta}
                billing={billing}
                onCheckout={handleCheckout}
                loading={checkoutLoading}
              />
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: 'rgba(255,255,255,0.35)', ...sans }}>
            All plans include a 14-day free trial (no card required for Free plan).
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12" style={{ color: '#0F1B33', ...serif }}>
            Full feature comparison
          </h2>

          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(15,27,51,0.08)' }}>
            {/* Header */}
            <div className="grid grid-cols-5" style={{ background: '#0F1B33', borderBottom: '1px solid rgba(212,175,92,0.15)' }}>
              <div className="p-4" />
              {(['Free', 'Starter', 'Professional', 'Enterprise'] as const).map((name, i) => (
                <div key={name} className="p-4 text-center" style={{ borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-semibold text-sm" style={{ color: i === 1 ? '#D4AF5C' : 'white', ...serif }}>{name}</p>
                </div>
              ))}
            </div>

            {COMPARISON_ROWS.map(({ category, features }, ci) => (
              <div key={category}>
                <div
                  className="px-4 py-3"
                  style={{ background: '#F8F8F6', borderBottom: '1px solid rgba(15,27,51,0.06)', borderTop: ci > 0 ? '1px solid rgba(15,27,51,0.06)' : 'none' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(15,27,51,0.4)', ...sans }}>{category}</p>
                </div>
                {features.map(({ label, free, starter, pro, ent }, fi) => (
                  <div
                    key={label}
                    className="grid grid-cols-5"
                    style={{ borderBottom: fi < features.length - 1 ? '1px solid rgba(15,27,51,0.05)' : 'none' }}
                  >
                    <div className="px-4 py-3">
                      <p className="text-sm" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>{label}</p>
                    </div>
                    {([free, starter, pro, ent] as ColVal[]).map((val, vi) => (
                      <div
                        key={vi}
                        className="px-4 py-3 flex items-center justify-center"
                        style={{ borderLeft: '1px solid rgba(15,27,51,0.05)', background: vi === 1 ? 'rgba(212,175,92,0.03)' : 'transparent' }}
                      >
                        <CellValue value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section className="py-20" style={{ background: '#F8F8F6' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0F1B33', ...serif }}>
            Running a large NGO or INGO?
          </h2>
          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>
            We offer custom enterprise plans with multi-org support, dedicated onboarding,
            SLA guarantees, and white-label options. Let&apos;s talk.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold"
            style={{ background: '#0F1B33', color: '#D4AF5C', ...sans }}
          >
            Talk to Sales <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-center mb-12" style={{ color: '#0F1B33', ...serif }}>
            Common questions
          </h2>
          {[
            { q: 'Do I need a credit card to start?', a: 'No. The Free plan requires no credit card. Paid plans offer a 14-day trial — you only enter card details when you choose to upgrade.' },
            { q: 'Can I change plans later?', a: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing period.' },
            { q: 'What happens to my data if I downgrade?', a: 'Your data is preserved. Programs above your plan limit are archived (read-only) until you upgrade again.' },
            { q: 'Is OMANYE suitable for INGOs?', a: 'Yes, with the Professional plan or an enterprise arrangement. Contact us for multi-country and multi-office deployments.' },
            { q: 'Do donors pay anything?', a: 'No. Donors access their portal for free, always. OMANYE is funded entirely by NGO subscriptions.' },
          ].map(({ q, a }) => (
            <div key={q} className="py-5" style={{ borderBottom: '1px solid rgba(15,27,51,0.07)' }}>
              <h3 className="font-semibold mb-2 text-base" style={{ color: '#0F1B33', ...serif }}>{q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
