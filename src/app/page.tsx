'use client'

/**
 * OMANYE Marketing Homepage
 * 7 sections: Hero → Problem → How It Works → Features → Trust → Pricing → CTA
 * Unauthenticated users see this page; authenticated users are redirected by middleware.
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, Shield, TrendingUp, DollarSign, FileText,
  Map, Grid3X3, Eye, ChevronRight,
} from 'lucide-react'
import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import { FeatureCard } from '@/components/marketing/FeatureCard'
import { PlanCard } from '@/components/marketing/PlanCard'
import { AdinkraheneWatermark } from '@/components/marketing/AdinkraheneIcon'

// ── Shared style helpers ───────────────────────────────────────────────────────
const serif = { fontFamily: 'var(--font-fraunces),Georgia,serif' }
const sans  = { fontFamily: 'var(--font-instrument),system-ui,sans-serif' }

// ── Data ──────────────────────────────────────────────────────────────────────
const PAIN_POINTS = [
  {
    Icon: Grid3X3,
    title: 'Spreadsheet chaos',
    body: 'Teams juggle Excel files, WhatsApp updates, and email chains to track program data.',
  },
  {
    Icon: Eye,
    title: 'Donor anxiety',
    body: 'Donors want transparency but NGOs fear losing control of sensitive operational data.',
  },
  {
    Icon: FileText,
    title: 'Report dread',
    body: 'Quarterly reports take weeks to compile from scattered sources.',
  },
]

const NGO_STEPS = [
  { step: '01', title: 'Set up your programs', body: 'Add logframes, indicators, team members, and budget.' },
  { step: '02', title: 'Track progress in real time', body: 'Field staff submit data; indicators update automatically.' },
  { step: '03', title: 'Control what donors see', body: 'Grant specific access levels — you decide the detail.' },
  { step: '04', title: 'Generate reports in minutes', body: 'One click generates structured donor reports from live data.' },
]

const DONOR_STEPS = [
  { step: '01', title: 'Get invited by an NGO', body: 'Receive a secure invite link to their program portal.' },
  { step: '02', title: 'See what you fund', body: 'View indicators, budgets, and field updates — whatever the NGO has shared.' },
  { step: '03', title: 'Request more detail', body: 'Submit a formal access request if you need deeper insight.' },
  { step: '04', title: 'Download reports', body: 'Access structured progress reports directly in your portal.' },
]

const FEATURES = [
  { Icon: LayoutDashboard, title: 'Program Management',    desc: 'Logframes, indicators, M&E dashboards — all in one place.' },
  { Icon: Shield,           title: 'Donor Access Control', desc: 'Granular visibility settings. You control what each donor sees.' },
  { Icon: TrendingUp,       title: 'Real-time Indicators', desc: 'Track KPIs with time-series history and off-track alerts.' },
  { Icon: DollarSign,       title: 'Budget Tracking',      desc: 'Categories, expenditures, burn rate — with audit trail.' },
  { Icon: FileText,         title: 'One-click Reports',    desc: 'Generate structured donor reports from live program data.' },
  { Icon: Map,              title: 'Field Data Collection', desc: 'Custom forms for field staff, mobile-friendly submission.' },
]

const ACCESS_LEVELS = [
  { label: 'SUMMARY ONLY', fields: ['Program name', 'Status', 'Reporting period'] },
  { label: 'INDICATORS',   fields: ['Key KPIs', 'Progress %', 'Trend data'] },
  { label: 'BUDGET',       fields: ['Budget utilisation', 'Expenditure by category'] },
  { label: 'FULL ACCESS',  fields: ['All data', 'Field reports', 'Team activity'] },
]

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'For small NGOs getting started with transparent program management.',
    features: ['1 program', '3 team members', 'Core indicators', 'Basic donor portal', 'Community support'],
    cta: { label: 'Start Free', href: '/signup/ngo' },
  },
  {
    name: 'Starter',
    price: { monthly: 49, annual: 470 },
    description: 'For growing NGOs managing multiple programs and donor relationships.',
    features: ['5 programs', '10 team members', 'Donor access control', 'Report generation', 'Budget tracking', 'Email support'],
    cta: { label: 'Start Free Trial', href: '/signup/ngo' },
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Professional',
    price: { monthly: 149, annual: 1430 },
    description: 'For established NGOs that need full power, compliance, and scale.',
    features: ['Unlimited programs', 'Unlimited team members', 'All features', 'Field data collection', 'Audit trail & compliance', 'Priority support', 'API access'],
    cta: { label: 'Start Free Trial', href: '/signup/ngo' },
  },
]

// ── Sections ──────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: '#0F1B33' }}
    >
      {/* Decorative Adinkrahene watermarks */}
      <AdinkraheneWatermark
        size={600}
        className="absolute -right-32 top-1/2 -translate-y-1/2 pointer-events-none select-none"
      />
      <AdinkraheneWatermark
        size={300}
        className="absolute -left-16 bottom-16 pointer-events-none select-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left — 60% */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: '#D4AF5C', ...sans }}
            >
              NGO Workspace &amp; Donor Transparency
            </p>

            <h1
              className="text-5xl lg:text-6xl font-bold leading-tight text-balance"
              style={{ color: 'white', ...serif }}
            >
              Manage programs.{' '}
              <span style={{ color: '#D4AF5C' }}>Build donor trust.</span>{' '}
              Measure real impact.
            </h1>

            <p className="text-lg leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.65)', ...sans }}>
              OMANYE gives NGOs a unified workspace to run programs, track indicators, and share
              progress with donors — on their own terms.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/signup/ngo"
                className="px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-150 inline-flex items-center gap-2"
                style={{ background: '#D4AF5C', color: '#0F1B33', ...sans }}
              >
                Start Free — No Card Required <ChevronRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-150"
                style={{
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  ...sans,
                }}
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-col gap-3 pt-4">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)', ...sans }}>
                Trusted by NGOs across 12 countries
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — 40% app mockup */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-3xl blur-3xl"
                style={{ background: 'rgba(212,175,92,0.12)', transform: 'scale(1.1)' }}
              />
              {/* Device frame */}
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  width: '340px',
                  background: '#1a2e4a',
                  border: '2px solid rgba(212,175,92,0.2)',
                  boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                }}
              >
                {/* Fake browser bar */}
                <div
                  className="flex items-center gap-1.5 px-4 py-3"
                  style={{ background: '#0F1B33', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {['#ef4444','#f59e0b','#22c55e'].map((c,i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                  <div className="flex-1 mx-3 h-4 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
                {/* Mock dashboard */}
                <div className="p-4 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['Active Programs', 'Indicators', 'Donors'].map((label, i) => (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="h-4 w-8 rounded mb-2" style={{ background: '#D4AF5C', opacity: 0.8 }} />
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', ...sans }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {['Program Alpha', 'Program Beta', 'Program Gamma'].map((p, i) => (
                    <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(212,175,92,0.15)' }} />
                      <div className="flex-1 min-w-0">
                        <div className="h-2.5 rounded w-24 mb-1.5" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${[75, 52, 88][i]}%`, background: '#D4AF5C' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProblemSection() {
  return (
    <section className="py-24" style={{ background: 'white' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          className="text-3xl lg:text-4xl font-bold mb-4"
          style={{ color: '#0F1B33', ...serif }}
        >
          NGO reporting shouldn&apos;t feel like punishment
        </h2>
        <p className="text-base mb-16" style={{ color: 'rgba(15,27,51,0.55)', ...sans }}>
          Most NGO tools were built for finance teams, not field workers or mission-driven managers.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl p-6 text-left"
              style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.07)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(212,175,92,0.12)', color: '#D4AF5C' }}
              >
                <Icon size={18} />
              </div>
              <h3 className="font-semibold mb-2 text-base" style={{ color: '#0F1B33', ...serif }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'ngo' | 'donor'>('ngo')
  const steps = activeTab === 'ngo' ? NGO_STEPS : DONOR_STEPS

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" style={{ background: '#0F1B33' }}>
      <AdinkraheneWatermark
        size={500}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'white', ...serif }}>
            One platform. Full control.
          </h2>
          <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)', ...sans }}>
            Whether you run programs or fund them, OMANYE gives you clarity.
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-xl p-1 mx-auto w-fit mb-12"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['ngo', 'donor'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-8 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === tab ? '#D4AF5C' : 'transparent',
                color: activeTab === tab ? '#0F1B33' : 'rgba(255,255,255,0.6)',
                ...sans,
              }}
            >
              {tab === 'ngo' ? 'For NGOs' : 'For Donors'}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ step, title, body }) => (
            <div key={step} className="flex flex-col gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(212,175,92,0.15)', color: '#D4AF5C', ...sans }}
              >
                {step}
              </div>
              <h3 className="font-semibold text-base leading-snug" style={{ color: 'white', ...serif }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', ...sans }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section className="py-24" style={{ background: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#0F1B33', ...serif }}>
            Everything your NGO needs
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: 'rgba(15,27,51,0.55)', ...sans }}>
            Purpose-built for program managers, field staff, and the donors who fund them.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }) => (
            <FeatureCard key={title} icon={<Icon size={18} />} title={title} description={desc} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DonorTrustSection() {
  return (
    <section className="py-24" style={{ background: '#F8F8F6' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — quote */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: '#D4AF5C', ...sans }}
            >
              Donor Transparency
            </p>
            <blockquote
              className="text-2xl lg:text-3xl font-medium leading-relaxed mb-8"
              style={{ color: '#0F1B33', fontStyle: 'italic', ...serif }}
            >
              &ldquo;OMANYE changed how we communicate with our funders. We share what matters,
              protect what&apos;s internal, and our donors feel more connected than ever.&rdquo;
            </blockquote>
            <p className="text-sm font-medium" style={{ color: 'rgba(15,27,51,0.5)', ...sans }}>
              — Placeholder NGO Name, Ghana
            </p>
          </div>

          {/* Right — access level cards */}
          <div className="flex flex-col gap-3">
            {ACCESS_LEVELS.map((level, i) => (
              <div
                key={level.label}
                className="rounded-xl p-4 flex items-start gap-4 transition-all duration-200"
                style={{
                  background: 'white',
                  border: '1px solid rgba(15,27,51,0.08)',
                  opacity: 0.4 + i * 0.2,
                }}
              >
                <div
                  className="px-2.5 py-1 rounded text-xs font-bold flex-shrink-0"
                  style={{ background: '#0F1B33', color: '#D4AF5C', ...sans }}
                >
                  {level.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {level.fields.map((f) => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{ background: 'rgba(15,27,51,0.06)', color: 'rgba(15,27,51,0.6)', ...sans }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-center mt-2" style={{ color: 'rgba(15,27,51,0.35)', ...sans }}>
              You control exactly what each donor sees
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function PricingPreviewSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: '#0F1B33' }}>
      <AdinkraheneWatermark
        size={400}
        className="absolute right-0 bottom-0 pointer-events-none"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'white', ...serif }}>
            Simple, transparent pricing
          </h2>
          {/* Billing toggle */}
          <div
            className="flex rounded-xl p-1 mx-auto w-fit mt-6"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['monthly', 'annual'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: billing === b ? '#D4AF5C' : 'transparent',
                  color: billing === b ? '#0F1B33' : 'rgba(255,255,255,0.6)',
                  ...sans,
                }}
              >
                {b === 'monthly' ? 'Monthly' : 'Annual'}{b === 'annual' && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded text-xs"
                    style={{ background: 'rgba(15,27,51,0.3)', color: billing === 'annual' ? '#0F1B33' : 'rgba(212,175,92,0.8)' }}
                  >
                    Save 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} {...plan} billing={billing} />
          ))}
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-6">
          <Link
            href="/pricing"
            className="text-sm font-medium underline underline-offset-4 transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.5)', ...sans }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF5C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            View full pricing details
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <Link
            href="/contact"
            className="text-sm font-medium underline underline-offset-4 transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.5)', ...sans }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF5C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Enterprise? Let&apos;s talk
          </Link>
        </div>
      </div>
    </section>
  )
}

function CTABannerSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: '#D4AF5C' }}>
      {/* Decorative rings on gold */}
      <div
        className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none"
        style={{ width: '400px', background: 'radial-gradient(circle at 100% 50%, #0F1B33 0%, transparent 70%)' }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: '#0F1B33', ...serif }}>
          Ready to bring clarity to your programs?
        </h2>
        <p className="text-base mb-10" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>
          Start free — no credit card required. Set up your workspace in minutes.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/signup/ngo"
            className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-150 inline-flex items-center gap-2"
            style={{ background: '#0F1B33', color: '#D4AF5C', ...sans }}
          >
            Get Started <ChevronRight size={18} />
          </Link>
          <Link
            href="/contact"
            className="px-8 py-4 rounded-xl text-base font-semibold transition-all duration-150"
            style={{
              background: 'transparent',
              color: '#0F1B33',
              border: '2px solid rgba(15,27,51,0.3)',
              ...sans,
            }}
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <DonorTrustSection />
        <PricingPreviewSection />
        <CTABannerSection />
      </main>
      <Footer />
    </>
  )
}
