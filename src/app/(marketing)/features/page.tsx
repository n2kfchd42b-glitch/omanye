import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LayoutDashboard, Shield, TrendingUp, DollarSign, FileText,
  Map, ScrollText, Users, ChevronRight,
} from 'lucide-react'
import { AdinkraheneWatermark } from '@/components/marketing/AdinkraheneIcon'

export const metadata: Metadata = {
  title: 'OMANYE Features — Program Management, Donor Control & Reporting',
  description:
    'Explore every feature of the OMANYE platform: logframes, donor access control, budget tracking, one-click reporting, and field data collection.',
}

const serif = { fontFamily: 'var(--font-fraunces),Georgia,serif' }
const sans  = { fontFamily: 'var(--font-instrument),system-ui,sans-serif' }

const FEATURES = [
  {
    Icon: LayoutDashboard,
    title: 'Program & Indicator Management',
    tag: 'NGO Team',
    tagColor: '#2E7D52',
    tagBg: 'rgba(46,125,82,0.1)',
    description:
      'Build complete logframe matrices with objectives, outcomes, outputs, and activities. Track every indicator with time-series history, baseline values, and targets.',
    bullets: [
      'Logframe builder with drag-and-drop ordering',
      'Indicator tracking with current, target, and baseline values',
      'Off-track alerts and automated notifications',
      'Program updates and milestone logging',
      'M&E dashboard with visual progress charts',
      'Bulk indicator import from CSV',
    ],
  },
  {
    Icon: Shield,
    title: 'Donor Access Control',
    tag: 'Both',
    tagColor: '#0F1B33',
    tagBg: 'rgba(15,27,51,0.1)',
    description:
      'The feature that defines OMANYE. You decide — down to the field — what each donor can see. Four access tiers give you complete control without operational exposure.',
    bullets: [
      'Four access levels: Summary Only → Indicators → Budget → Full',
      'Per-donor access configuration (different donors see different things)',
      'Indicator-level visibility flags (is_key_indicator, visible_to_donors)',
      'Donor portal with filtered views',
      'Formal access request workflow',
      'Invite donors via secure tokenised links',
    ],
    highlight: true,
  },
  {
    Icon: DollarSign,
    title: 'Budget & Financial Tracking',
    tag: 'NGO Team',
    tagColor: '#2E7D52',
    tagBg: 'rgba(46,125,82,0.1)',
    description:
      'Full budget lifecycle from categories to expenditures. Track funding tranches, amendments, and burn rate — with a complete audit trail on every change.',
    bullets: [
      'Budget categories with planned vs. actual spend',
      'Expenditure logging with receipt attachments',
      'Funding tranche management',
      'Budget amendments with justification notes',
      'Burn rate calculation and overspend alerts',
      'Budget vs. expenditure summary view',
    ],
  },
  {
    Icon: FileText,
    title: 'Reporting & PDF Export',
    tag: 'Both',
    tagColor: '#0F1B33',
    tagBg: 'rgba(15,27,51,0.1)',
    description:
      'Generate structured donor reports in one click from live program data. No copy-paste, no stale numbers. Reports are always current.',
    bullets: [
      'One-click report generation from live data',
      'Report types: Progress, Quarterly, Annual, Donor Brief',
      'Configurable sections (Executive Summary, Indicators, Budget, Field Data)',
      'PDF export with branded layout',
      'Report archive with version history',
      'Donor-facing report portal',
    ],
  },
  {
    Icon: Map,
    title: 'Field Data Collection',
    tag: 'NGO Team',
    tagColor: '#2E7D52',
    tagBg: 'rgba(46,125,82,0.1)',
    description:
      'Deploy custom data collection forms to field staff. Mobile-friendly submission, offline support, and automatic aggregation into your program dashboard.',
    bullets: [
      'Custom form builder (text, number, select, date, boolean)',
      'Mobile-friendly submission interface',
      'Per-program form assignment',
      'Submission review and flagging workflow',
      'MAE summary aggregation',
      'Field data export',
    ],
  },
  {
    Icon: ScrollText,
    title: 'Audit Trail & Compliance',
    tag: 'NGO Team',
    tagColor: '#2E7D52',
    tagBg: 'rgba(46,125,82,0.1)',
    description:
      'Every action in OMANYE is logged. Know exactly who changed what and when — critical for compliance, donor assurance, and organisational accountability.',
    bullets: [
      'Immutable audit log for all data changes',
      '31 tracked action types across programs, budget, team, and donors',
      'Filterable audit trail by entity, actor, and time range',
      'Export audit log for compliance reporting',
      'Real-time notifications for critical events',
      'Notification preferences per user',
    ],
  },
  {
    Icon: Users,
    title: 'Team Management',
    tag: 'NGO Team',
    tagColor: '#2E7D52',
    tagBg: 'rgba(46,125,82,0.1)',
    description:
      'Invite team members with role-based access. Assign staff to specific programs. Manage permissions without exposing everything to everyone.',
    bullets: [
      'Roles: NGO Admin, Staff, Viewer',
      'Email invitation with tokenised accept flow',
      'Per-program team assignments',
      'Role change history in audit trail',
      'Organisation settings and branding',
      'Multi-org support (coming soon)',
    ],
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: '#0F1B33' }}>
        <AdinkraheneWatermark
          size={500}
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF5C', ...sans }}>
            Platform Features
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold mb-5 text-balance" style={{ color: 'white', ...serif }}>
            Built for NGO professionals
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)', ...sans }}>
            OMANYE combines the tools program managers actually need — without the complexity
            of enterprise software designed for corporates.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      <div className="bg-white">
        {FEATURES.map(({ Icon, title, tag, tagColor, tagBg, description, bullets, highlight }, idx) => (
          <section
            key={title}
            className="py-20 border-b"
            style={{ borderColor: 'rgba(15,27,51,0.07)', background: idx % 2 === 1 ? '#F8F8F6' : 'white' }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid lg:grid-cols-2 gap-16 items-start ${idx % 2 === 1 ? 'lg:[direction:rtl]' : ''}`} style={{ direction: 'ltr' }}>
                {/* Text */}
                <div className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: highlight ? 'rgba(212,175,92,0.15)' : 'rgba(15,27,51,0.06)', color: highlight ? '#D4AF5C' : '#0F1B33' }}
                    >
                      <Icon size={18} />
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: tagBg, color: tagColor, ...sans }}
                    >
                      {tag}
                    </span>
                    {highlight && (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(212,175,92,0.12)', color: '#D4AF5C', ...sans }}
                      >
                        Unique selling point
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: '#0F1B33', ...serif }}>
                    {title}
                  </h2>
                  <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(15,27,51,0.6)', ...sans }}>
                    {description}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-sm" style={{ color: 'rgba(15,27,51,0.75)', ...sans }}>
                        <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#D4AF5C' }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Placeholder illustration */}
                <div className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                  <div
                    className="rounded-2xl h-72 flex items-center justify-center"
                    style={{
                      background: highlight
                        ? 'linear-gradient(135deg, #0F1B33 0%, #1a2e4a 100%)'
                        : 'linear-gradient(135deg, #F8F8F6 0%, #eee 100%)',
                      border: highlight
                        ? '1px solid rgba(212,175,92,0.2)'
                        : '1px solid rgba(15,27,51,0.08)',
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{
                          background: highlight ? 'rgba(212,175,92,0.15)' : 'rgba(15,27,51,0.06)',
                          color: highlight ? '#D4AF5C' : 'rgba(15,27,51,0.3)',
                        }}
                      >
                        <Icon size={28} />
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color: highlight ? 'rgba(255,255,255,0.3)' : 'rgba(15,27,51,0.25)',
                          ...sans,
                        }}
                      >
                        Screenshot coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="py-20 text-center" style={{ background: '#0F1B33' }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'white', ...serif }}>
            Ready to see it in action?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.5)', ...sans }}>
            Start free — no credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup/ngo"
              className="px-7 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              style={{ background: '#D4AF5C', color: '#0F1B33', ...sans }}
            >
              Get Started Free <ChevronRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', ...sans }}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
