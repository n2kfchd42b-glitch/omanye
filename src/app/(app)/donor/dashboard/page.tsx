import Link from 'next/link'
import { requireDonorAuth } from '@/lib/auth/server'
import { COLORS } from '@/lib/tokens'
import type { AccessLevel } from '@/lib/supabase/database.types'

export default async function DonorDashboardPage() {
  const { supabase, user } = await requireDonorAuth()

  // Fetch active grants for this donor
  const { data: rawGrants } = await supabase
    .from('donor_program_access')
    .select('id, access_level, can_download_reports, granted_at, expires_at, program_id, donor_id')
    .eq('donor_id', user.id)
    .eq('active', true)
    .order('granted_at', { ascending: false })
    .limit(20)

  const programIds = (rawGrants ?? []).map(g => g.program_id)
  const programMap: Record<string, { name: string; status: string; orgName: string; orgSlug: string }> = {}

  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from('programs')
      .select('id, name, status, organization_id')
      .in('id', programIds)

    const orgIdSet: Record<string, true> = {}
    for (const p of programs ?? []) orgIdSet[p.organization_id] = true
    const orgIds = Object.keys(orgIdSet)
    const { data: orgs } = orgIds.length > 0
      ? await supabase.from('organizations').select('id, name, slug').in('id', orgIds)
      : { data: [] }

    const orgById = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
    for (const p of programs ?? []) {
      const org = orgById[p.organization_id]
      programMap[p.id] = { name: p.name, status: p.status, orgName: org?.name ?? '', orgSlug: org?.slug ?? '' }
    }
  }

  const grants = (rawGrants ?? []).map(g => ({
    ...g,
    program: programMap[g.program_id] ?? null,
  }))

  const ACCESS_LABEL: Record<AccessLevel, string> = {
    SUMMARY_ONLY:          'Summary Only',
    INDICATORS:            'Indicators',
    INDICATORS_AND_BUDGET: 'Indicators & Budget',
    FULL:                  'Full Access',
  }

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE:    '#38A169',
    PLANNING:  '#92400E',
    COMPLETED: '#475569',
    SUSPENDED: '#991B1B',
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.snow }}>
      {/* Top bar */}
      <div style={{
        height:         58,
        background:     COLORS.forest,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 24px',
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        zIndex:         50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: '#D4AF5C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Palatino, Georgia, serif', fontWeight: 700, fontSize: 14, color: COLORS.forest,
          }}>O</div>
          <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: 0.5 }}>
            OMANYE
          </span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>Donor Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{user.profile.full_name ?? user.email}</span>
        </div>
      </div>

      {/* Main content */}
      <main style={{ paddingTop: 82, padding: '82px 24px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.ink, fontFamily: 'Palatino, Georgia, serif', marginBottom: 6 }}>
            Donor Portal
          </h1>
          <p style={{ fontSize: 15, color: COLORS.slate }}>
            Your active programme access grants
          </p>
        </div>

        {/* Quick nav */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
          {[
            { href: '/donor/programs',      label: 'Programs',      emoji: '📋' },
            { href: '/donor/reports',       label: 'Reports',       emoji: '📄' },
            { href: '/donor/notifications', label: 'Notifications', emoji: '🔔' },
            { href: '/donor/access',        label: 'My Access',     emoji: '🔑' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                background: '#FFFFFF', border: '1px solid #E4EFE7',
                fontSize: 13, fontWeight: 600, color: COLORS.forest,
                textDecoration: 'none', transition: 'box-shadow 0.15s',
              }}
            >
              <span>{item.emoji}</span> {item.label}
            </Link>
          ))}
        </div>

        {grants.length === 0 ? (
          <div style={{
            padding: 40, borderRadius: 16, background: '#FFFFFF', border: '1px solid #E4EFE7', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🤝</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
              No programme access yet
            </h2>
            <p style={{ fontSize: 14, color: COLORS.slate, maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
              NGOs will grant donor access once they onboard funders.
            </p>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.charcoal, marginBottom: 16 }}>
              Programmes with active access ({grants.length})
            </h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {grants.map(grant => (
                <div key={grant.id} style={{
                  padding: 20, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E4EFE7',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
                      {grant.program?.name ?? 'Unknown programme'}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.slate, marginBottom: 8 }}>
                      {grant.program?.orgName ?? ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#0369A1', background: '#E0F2FE',
                        padding: '2px 8px', borderRadius: 4,
                      }}>
                        {ACCESS_LABEL[grant.access_level] ?? grant.access_level}
                      </span>
                      {grant.program?.status && (
                        <span style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[grant.program.status] ?? COLORS.slate }}>
                          {grant.program.status.charAt(0) + grant.program.status.slice(1).toLowerCase()}
                        </span>
                      )}
                      {grant.can_download_reports && (
                        <span style={{ fontSize: 11, color: COLORS.stone }}>· Can download reports</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.stone, whiteSpace: 'nowrap', marginTop: 2 }}>
                    {grant.expires_at
                      ? `Expires ${new Date(grant.expires_at).toLocaleDateString()}`
                      : 'No expiry'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
