// POST /api/grants/regenerate-section
// Body: { grant_id, version_number, section_name, user_instruction? }
// Fetches NGO profile + existing sections, rewrites the specified section only.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError, notFound } from '@/lib/api/errors'
import { SECTION_LABELS, type SectionKey } from '@/lib/grant-types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()
  if (!profile.organization_id) return forbidden('No organization found')

  let body: { grant_id?: string; version_number?: number; section_name?: string; user_instruction?: string }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const { grant_id, version_number, section_name, user_instruction } = body
  if (!grant_id || !version_number || !section_name) {
    return internalError('grant_id, version_number, and section_name are required')
  }

  const sectionLabel = SECTION_LABELS[section_name as SectionKey]
  if (!sectionLabel) return internalError(`Unknown section: ${section_name}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase

  // Verify grant belongs to user's org
  const { data: grant } = await db
    .from('grants')
    .select('id, organization_id, funder_name, opportunity_title, funding_amount_requested, currency, geographic_focus')
    .eq('id', grant_id)
    .single()

  if (!grant) return notFound('Grant')
  if (grant.organization_id !== profile.organization_id) return forbidden()

  // Fetch the specified version
  const { data: version } = await db
    .from('grant_versions')
    .select('content, generation_inputs')
    .eq('grant_id', grant_id)
    .eq('version_number', version_number)
    .single()

  if (!version) return notFound('Grant version')

  // Fetch org profile
  const { data: orgData } = await db
    .from('organizations')
    .select('name, mission_statement, founding_year, beneficiary_types, past_program_summaries, key_achievements')
    .eq('id', profile.organization_id)
    .single()

  const ngoContext = [
    `Organization: ${orgData?.name ?? ''}`,
    orgData?.mission_statement ? `Mission: ${orgData.mission_statement}` : '',
    orgData?.beneficiary_types?.length ? `Beneficiaries: ${orgData.beneficiary_types.join(', ')}` : '',
    orgData?.past_program_summaries ? `Past programs: ${orgData.past_program_summaries}` : '',
    orgData?.key_achievements ? `Key achievements: ${orgData.key_achievements}` : '',
  ].filter(Boolean).join('\n')

  const existingSections = (version.content ?? {}) as Record<string, string>
  const otherSections = Object.entries(existingSections)
    .filter(([k]) => k !== section_name)
    .map(([k, v]) => `### ${SECTION_LABELS[k as SectionKey] ?? k}\n${v}`)
    .join('\n\n')

  const form = version.generation_inputs as Record<string, string | number>
  const grantContext = [
    `Funder: ${grant.funder_name}`,
    `Opportunity: ${grant.opportunity_title}`,
    `Amount: ${grant.currency} ${Number(grant.funding_amount_requested).toLocaleString()}`,
    form?.funder_priorities ? `Funder priorities: ${form.funder_priorities}` : '',
    form?.geographic_focus  ? `Geographic focus: ${form.geographic_focus}`   : '',
    form?.target_beneficiary_count ? `Target beneficiaries: ${Number(form.target_beneficiary_count).toLocaleString()}` : '',
    form?.program_duration_months  ? `Program duration: ${form.program_duration_months} months`                        : '',
    form?.specific_requirements    ? `Requirements: ${form.specific_requirements}`                                     : '',
  ].filter(Boolean).join('\n')

  const systemPrompt = `You are a professional grant writer. Rewrite only the "${sectionLabel}" section of an existing grant proposal.
The rewritten section must be coherent with the other sections already written.
Return only the section text, without any header or label. No preamble, no sign-off.`

  const userPrompt = `NGO CONTEXT:
${ngoContext}

GRANT CONTEXT:
${grantContext}

OTHER SECTIONS (for coherence):
${otherSections}

${user_instruction ? `USER INSTRUCTION: ${user_instruction}\n\n` : ''}Rewrite the "${sectionLabel}" section now:`

  try {
    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { text: string }).text)
      .join('')

    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LLM error'
    return internalError(msg)
  }
}
