import type { Metadata } from 'next'
import Link from 'next/link'
import { OmanyeLogo, OmanyeSymbol } from '@/components/Logo'
import { AdinkraheneWatermark } from '@/components/marketing/AdinkraheneIcon'

export const metadata: Metadata = {
  title: 'About OMANYE — Built for NGO Professionals',
  description:
    'OMANYE means "good deeds" in Akan. We built this platform because NGOs doing critical work deserve tools that match their ambition.',
}

const serif = { fontFamily: 'var(--font-fraunces),Georgia,serif' }
const sans  = { fontFamily: 'var(--font-instrument),system-ui,sans-serif' }

const VALUES = [
  {
    label: 'Transparency',
    body: 'We believe donors and beneficiaries deserve to see how resources are used. OMANYE makes transparency easy — without sacrificing NGO autonomy.',
  },
  {
    label: 'Autonomy',
    body: 'NGOs should control their own narrative. We give you the tools to share on your terms, with granular control over every data point.',
  },
  {
    label: 'Simplicity',
    body: 'Complexity is the enemy of adoption. We design for program managers, not enterprise architects.',
  },
  {
    label: 'Impact',
    body: 'Every feature exists to help NGOs deliver better programs and demonstrate real results to the people who fund them.',
  },
]

const TEAM_PLACEHOLDERS = [
  { initials: 'AO', role: 'Founder & CEO' },
  { initials: 'KA', role: 'Head of Product' },
  { initials: 'EQ', role: 'Lead Engineer' },
  { initials: 'NB', role: 'Design Lead' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden" style={{ background: '#0F1B33' }}>
        <AdinkraheneWatermark
          size={500}
          className="absolute -right-24 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="flex justify-center mb-8">
            <OmanyeLogo size="xl" showTagline variant="dark" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-balance" style={{ color: 'white', ...serif }}>
            Built for the work that matters most
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)', ...sans }}>
            OMANYE means &ldquo;good deeds&rdquo; in Akan. We built this platform because NGOs
            doing critical work deserve tools that match their ambition.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF5C', ...sans }}>
            Our Mission
          </p>
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#0F1B33', ...serif }}>
            Why we built OMANYE
          </h2>
          <div className="prose max-w-none text-base leading-relaxed" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>
            <p className="mb-4">
              Every week, program managers at small and mid-sized NGOs spend days compiling
              reports from spreadsheets, WhatsApp groups, and email threads. Field staff submit
              data into forms that nobody reads. Donors receive PDFs with numbers they can&apos;t
              verify. And organisations that do extraordinary work remain invisible to the funders
              who could scale them.
            </p>
            <p className="mb-4">
              This is the reporting burden. It&apos;s not inevitable — it&apos;s a tooling problem.
            </p>
            <p className="mb-4">
              Enterprise NGO software exists but costs hundreds of thousands of dollars and takes
              months to implement. Generic project management tools weren&apos;t built for logframes,
              indicators, or donor transparency requirements. So most NGOs cobble together
              workarounds that cost them time they don&apos;t have.
            </p>
            <p>
              OMANYE is purpose-built for this gap: a unified workspace that connects program
              management, M&E tracking, budget oversight, and donor communication in one place
              — affordable enough for organisations of any size.
            </p>
          </div>
        </div>
      </section>

      {/* Symbol meaning */}
      <section className="py-20 relative overflow-hidden" style={{ background: '#F8F8F6' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Symbol display */}
            <div className="flex justify-center">
              <div
                className="relative rounded-3xl p-12 flex items-center justify-center"
                style={{ background: '#0F1B33', width: '280px', height: '280px' }}
              >
                <OmanyeSymbol size={140} />
              </div>
            </div>
            {/* Explanation */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF5C', ...sans }}>
                The Adinkrahene Symbol
              </p>
              <h2 className="text-2xl lg:text-3xl font-bold mb-5" style={{ color: '#0F1B33', ...serif }}>
                Our visual identity
              </h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>
                The Adinkrahene — concentric circles — is one of the most important Adinkra
                symbols in Akan culture, representing{' '}
                <strong style={{ color: '#0F1B33' }}>greatness, charisma, and leadership</strong>.
                It is said to be the chief of all Adinkra symbols.
              </p>
              <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>
                We chose it as the OMANYE logomark because it speaks to the quiet power of
                organisations that lead through service — NGOs that may not make headlines,
                but whose work ripples outward like those concentric circles.
              </p>
              <p className="text-base leading-relaxed" style={{ color: 'rgba(15,27,51,0.7)', ...sans }}>
                The symbol appears throughout the platform as a reminder of that purpose.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF5C', ...sans }}>
              What guides us
            </p>
            <h2 className="text-3xl font-bold" style={{ color: '#0F1B33', ...serif }}>Our values</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map(({ label, body }) => (
              <div
                key={label}
                className="rounded-2xl p-8"
                style={{ background: '#F8F8F6', border: '1px solid rgba(15,27,51,0.07)' }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: '#0F1B33', ...serif }}>
                  {label}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(15,27,51,0.65)', ...sans }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 relative overflow-hidden" style={{ background: '#0F1B33' }}>
        <AdinkraheneWatermark
          size={400}
          className="absolute left-0 bottom-0 pointer-events-none"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF5C', ...sans }}>
              The team
            </p>
            <h2 className="text-3xl font-bold" style={{ color: 'white', ...serif }}>
              The people behind OMANYE
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_PLACEHOLDERS.map(({ initials, role }) => (
              <div key={initials} className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-lg font-bold"
                  style={{ background: 'rgba(212,175,92,0.12)', color: '#D4AF5C', ...serif }}
                >
                  {initials}
                </div>
                <div
                  className="h-3 rounded w-24 mx-auto mb-2"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', ...sans }}>{role}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-8" style={{ color: 'rgba(255,255,255,0.3)', ...sans }}>
            Team profiles coming soon
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center" style={{ background: 'white' }}>
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4" style={{ color: '#0F1B33', ...serif }}>
            Join us in building it
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(15,27,51,0.55)', ...sans }}>
            Whether you&apos;re an NGO, a donor, or someone who shares our mission — we&apos;d love to connect.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup/ngo"
              className="px-7 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#0F1B33', color: '#D4AF5C', ...sans }}
            >
              Start Free
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'transparent', color: '#0F1B33', border: '1px solid rgba(15,27,51,0.2)', ...sans }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
