import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe, MapPin, Hash, ArrowRight, LayoutDashboard, TrendingUp, Map } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { OrgCard } from '@/components/marketing/OrgCard'
import { AdinkraheneWatermark } from '@/components/marketing/AdinkraheneIcon'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('name, description')
    .eq('slug', params.slug)
    .single()

  if (!org) return { title: 'Organization not found' }

  return {
    title: `${org.name} — Programs on OMANYE`,
    description: org.description ?? `View ${org.name}'s public programs and impact data on OMANYE.`,
  }
}

export default async function PublicOrgProfilePage({ params }: Props) {
  const supabase = createClient()

  // Fetch org
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, description, logo_url, website, country, registration_number')
    .eq('slug', params.slug)
    .single()

  if (!org) notFound()

  // Fetch public programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name, objective, description, location_country, location_region, primary_funder, status, tags, cover_image_url, visibility')
    .eq('organization_id', org.id)
    .eq('visibility', 'PUBLIC')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const publicPrograms = programs ?? []

  type PublicProgram = {
    id: string
    name: string
    objective: string | null
    description: string | null
    location_country: string | null
    location_region: string | null
    primary_funder: string | null
    status: string
    tags: string[] | null
    cover_image_url: string | null
    visibility: string
  }

  // Fetch key indicators for public programs
  type ProgramWithIndicators = PublicProgram & {
    indicators: { name: string; current_value: number; target_value: number | null; unit: string | null }[]
  }

  const programsWithIndicators: ProgramWithIndicators[] = await Promise.all(
    (publicPrograms as PublicProgram[]).map(async (program) => {
      const { data: indicators } = await supabase
        .from('indicators')
        .select('name, current_value, target_value, unit')
        .eq('program_id', program.id)
        .eq('is_key_indicator', true)
        .eq('visible_to_donors', true)
        .order('sort_order', { ascending: true })
        .limit(3)

      return { ...program, indicators: indicators ?? [] }
    })
  )

  // Aggregate stats
  const activeCount    = (publicPrograms as PublicProgram[]).filter((p) => p.status === 'ACTIVE').length
  const countries      = new Set((publicPrograms as PublicProgram[]).map((p) => p.location_country).filter(Boolean)).size
  const indicatorCount = programsWithIndicators.reduce((sum, p) => sum + p.indicators.length, 0)

  return (
    <>
      {/* Org header */}
      <section className="pt-24 pb-12 relative overflow-hidden" style={{ background: '#0F1B33' }}>
        <AdinkraheneWatermark
          size={400}
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Logo / initials */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{
                background: org.logo_url ? 'transparent' : 'rgba(212,175,92,0.15)',
                color: '#D4AF5C',
                backgroundImage: org.logo_url ? `url(${org.logo_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: 'var(--font-fraunces),Georgia,serif',
              }}
            >
              {!org.logo_url && org.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-3xl lg:text-4xl font-bold text-white mb-2"
                style={{ fontFamily: 'var(--font-fraunces),Georgia,serif' }}
              >
                {org.name}
              </h1>

              {/* Meta row */}
              <div
                className="flex flex-wrap items-center gap-4 mb-4 text-sm"
                style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
              >
                {org.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {org.country}
                  </span>
                )}
                {org.registration_number && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} /> Reg. {org.registration_number}
                  </span>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors duration-150 hover:text-gold"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <Globe size={13} /> {org.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>

              {org.description && (
                <p
                  className="text-base leading-relaxed max-w-2xl"
                  style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
                >
                  {org.description}
                </p>
              )}

              <div className="mt-5">
                <Link
                  href="/signup/donor"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                  style={{
                    background: '#D4AF5C',
                    color: '#0F1B33',
                    fontFamily: 'var(--font-instrument),system-ui,sans-serif',
                  }}
                >
                  Partner with us <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact stats bar */}
      {publicPrograms.length > 0 && (
        <section
          className="py-6"
          style={{ background: 'white', borderBottom: '1px solid rgba(15,27,51,0.07)' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { Icon: LayoutDashboard, value: activeCount,     label: 'Active Programs' },
                { Icon: Map,             value: countries,        label: 'Countries' },
                { Icon: TrendingUp,      value: indicatorCount,   label: 'Indicators Tracked' },
              ].map(({ Icon, value, label }) => (
                <div key={label}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: 'rgba(212,175,92,0.1)', color: '#D4AF5C' }}
                  >
                    <Icon size={18} />
                  </div>
                  <p
                    className="text-2xl font-bold mb-0.5"
                    style={{ color: '#0F1B33', fontFamily: 'var(--font-fraunces),Georgia,serif' }}
                  >
                    {value}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'rgba(15,27,51,0.5)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Public programs */}
      <section className="py-16" style={{ background: '#F8F8F6' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ color: '#0F1B33', fontFamily: 'var(--font-fraunces),Georgia,serif' }}
          >
            Our Programs
          </h2>

          {publicPrograms.length === 0 ? (
            <div
              className="rounded-2xl p-16 text-center"
              style={{ background: 'white', border: '1px solid rgba(15,27,51,0.08)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(15,27,51,0.05)' }}
              >
                <LayoutDashboard size={24} style={{ color: 'rgba(15,27,51,0.25)' }} />
              </div>
              <p
                className="text-base font-medium mb-2"
                style={{ color: 'rgba(15,27,51,0.5)', fontFamily: 'var(--font-fraunces),Georgia,serif' }}
              >
                No public programs yet
              </p>
              <p
                className="text-sm"
                style={{ color: 'rgba(15,27,51,0.35)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
              >
                This organisation has not published any public programs yet.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programsWithIndicators.map((program) => {
                const locationStr = [program.location_region, program.location_country].filter(Boolean).join(', ') || undefined
                return (
                <OrgCard
                  key={program.id}
                  slug={org.slug}
                  programId={program.id}
                  name={program.name}
                  objective={program.objective ?? ''}
                  location={locationStr}
                  funder={program.primary_funder ?? undefined}
                  status={program.status as 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'PLANNING'}
                  tags={program.tags ?? []}
                  indicators={program.indicators.map((ind) => ({
                    name: ind.name,
                    current: ind.current_value ?? 0,
                    target: ind.target_value ?? 1,
                    unit: ind.unit ?? undefined,
                  }))}
                  coverImage={program.cover_image_url}
                />
              )})}
            </div>
          )}
        </div>
      </section>

      {/* Donor CTA */}
      <section className="py-16 text-center" style={{ background: 'white' }}>
        <div className="max-w-xl mx-auto px-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#D4AF5C', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
          >
            For Donors
          </p>
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: '#0F1B33', fontFamily: 'var(--font-fraunces),Georgia,serif' }}
          >
            Interested in funding {org.name}?
          </h2>
          <p
            className="text-base mb-8"
            style={{ color: 'rgba(15,27,51,0.6)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
          >
            Create a free donor account to connect with this organisation and access
            detailed program data they choose to share with you.
          </p>
          <Link
            href="/signup/donor"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold"
            style={{
              background: '#0F1B33',
              color: '#D4AF5C',
              fontFamily: 'var(--font-instrument),system-ui,sans-serif',
            }}
          >
            Connect as Donor <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  )
}
