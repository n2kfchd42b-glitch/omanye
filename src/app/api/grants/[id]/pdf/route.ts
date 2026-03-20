// GET /api/grants/:id/pdf
// Generates and streams a PDF for the grant proposal.
// Auth: NGO team member belonging to the same org.

import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { GrantPdfTemplate } from '@/lib/grants/pdf'
import type { GrantSections } from '@/lib/grant-types'
import { unauthorized, forbidden, notFound } from '@/lib/api/errors'

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF', 'NGO_VIEWER'].includes(profile.role)) return forbidden()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  const { data: grant } = await db
    .from('grants')
    .select('*, grant_versions(version_number, content, created_at), organizations(name)')
    .eq('id', params.id)
    .single()

  if (!grant) return notFound('Grant')
  if (grant.organization_id !== profile.organization_id) return forbidden()

  // Get latest version content
  const versions = (grant.grant_versions ?? []) as { version_number: number; content: GrantSections; created_at: string }[]
  const latest   = versions.sort((a, b) => b.version_number - a.version_number)[0]

  const orgName  = (grant.organizations as { name: string } | null)?.name ?? 'Organization'

  // Dynamic import — @react-pdf/renderer is ESM-only
  const { renderToBuffer } = await import('@react-pdf/renderer')

  const element = React.createElement(GrantPdfTemplate, {
    orgName,
    grantTitle:    grant.opportunity_title,
    funderName:    grant.funder_name,
    fundingAmount: Number(grant.funding_amount_requested),
    currency:      grant.currency ?? 'USD',
    deadline:      grant.application_deadline ?? null,
    versionNumber: grant.current_version ?? 1,
    generatedAt:   latest?.created_at ?? grant.updated_at ?? new Date().toISOString(),
    sections:      (latest?.content ?? {}) as GrantSections,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await renderToBuffer(element as any)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="grant_${params.id}_v${grant.current_version}.pdf"`,
      'Cache-Control':       'no-store',
    },
  })
}
