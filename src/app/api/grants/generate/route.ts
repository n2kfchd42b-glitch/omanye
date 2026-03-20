// POST /api/grants/generate
// Accepts grant input form + organization_id.
// Fetches NGO grant profile, builds prompt, streams Anthropic response.
// Saves the completed grant + version 1 to the database.
// Returns SSE stream with section-by-section deltas.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, internalError } from '@/lib/api/errors'
import { SECTION_KEYS, SECTION_LABELS, type SectionKey, type GrantInputForm } from '@/lib/grant-types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Section delimiters the model uses so we can parse the stream
const SECTION_DELIMITER = (label: string) => `## ${label}`

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

  let body: { organization_id?: string; form?: Partial<GrantInputForm>; stream_only?: boolean; program_id?: string }
  try {
    body = await req.json()
  } catch {
    return internalError('Invalid JSON body')
  }

  const form       = body.form as GrantInputForm
  const streamOnly = !!body.stream_only
  const programId  = body.program_id ?? null
  if (!form?.funder_name || !form?.opportunity_title || !form?.funding_amount_requested) {
    return internalError('Missing required form fields')
  }

  // Fetch NGO profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data: orgData } = await db
    .from('organizations')
    .select('name, mission_statement, founding_year, beneficiary_types, past_program_summaries, key_achievements, typical_budget_range')
    .eq('id', profile.organization_id)
    .single()

  if (!orgData) return internalError('Organization not found')

  // Build prompt
  const ngoContext = `
Organization: ${orgData.name}
${orgData.founding_year ? `Founded: ${orgData.founding_year}` : ''}
${orgData.mission_statement ? `Mission: ${orgData.mission_statement}` : ''}
${orgData.beneficiary_types?.length ? `Beneficiaries served: ${orgData.beneficiary_types.join(', ')}` : ''}
${orgData.past_program_summaries ? `Past programs: ${orgData.past_program_summaries}` : ''}
${orgData.key_achievements ? `Key achievements: ${orgData.key_achievements}` : ''}
${orgData.typical_budget_range ? `Typical grant budget: ${orgData.typical_budget_range}` : ''}
`.trim()

  const grantContext = `
Funder: ${form.funder_name}
Opportunity: ${form.opportunity_title}
Amount Requested: ${form.currency} ${Number(form.funding_amount_requested).toLocaleString()}
Application Deadline: ${form.application_deadline || 'Not specified'}
Geographic Focus: ${form.geographic_focus}
Target Beneficiaries: ${Number(form.target_beneficiary_count).toLocaleString()} people
Program Duration: ${form.program_duration_months} months
Funder Priorities: ${form.funder_priorities}
${form.specific_requirements ? `Specific Requirements: ${form.specific_requirements}` : ''}
`.trim()

  const sectionList = SECTION_KEYS.map(k => `${SECTION_DELIMITER(SECTION_LABELS[k])}`).join(', ')

  const systemPrompt = `You are a professional grant writer helping an NGO write a compelling grant proposal.
Write in a clear, professional tone that is specific, evidence-based, and aligned with the funder's priorities.
Use concrete numbers and measurable outcomes wherever possible.
The proposal must contain exactly six sections in this order, each preceded by its header on its own line:
${SECTION_KEYS.map(k => SECTION_DELIMITER(SECTION_LABELS[k])).join('\n')}
Do not add any other sections or headers. Start directly with the first section header.`

  const userPrompt = `Write a complete grant proposal using the following information.

NGO CONTEXT:
${ngoContext}

GRANT-SPECIFIC INFORMATION:
${grantContext}

Write the full six-section proposal now, starting with ${SECTION_DELIMITER(SECTION_LABELS[SECTION_KEYS[0]])}.`

  // Stream SSE response
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Accumulate the full text while streaming section by section
        const sections: Record<string, string> = {}
        let currentSectionKey: SectionKey | null = null
        let buffer = ''

        const anthropicStream = anthropic.messages.stream({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: userPrompt }],
        })

        // Process text chunks
        anthropicStream.on('text', (text: string) => {
          buffer += text

          // Check if a new section header appears in the buffer
          for (const key of SECTION_KEYS) {
            const header = SECTION_DELIMITER(SECTION_LABELS[key])
            const idx    = buffer.indexOf(header)
            if (idx !== -1) {
              // Save any trailing text to the previous section
              if (currentSectionKey) {
                const trailingText = buffer.slice(0, idx)
                sections[currentSectionKey] = (sections[currentSectionKey] ?? '') + trailingText
                if (trailingText) send({ type: 'delta', section: currentSectionKey, text: trailingText })
              }
              // Start new section
              currentSectionKey = key
              if (!sections[key]) sections[key] = ''
              send({ type: 'section_start', section: key })
              buffer = buffer.slice(idx + header.length).trimStart()
              // Emit any content already in buffer after the header
              if (buffer && currentSectionKey) {
                sections[currentSectionKey] = buffer
                send({ type: 'delta', section: currentSectionKey, text: buffer })
                buffer = ''
              }
              break
            }
          }

          // If we're in a section and have no pending header match, emit buffered text
          if (currentSectionKey && buffer) {
            // Check if buffer might contain the start of a header
            const mightHaveHeader = SECTION_KEYS.some(k =>
              SECTION_DELIMITER(SECTION_LABELS[k]).split('').some((_, i, arr) =>
                buffer.endsWith(arr.slice(0, i + 1).join(''))
              )
            )
            if (!mightHaveHeader) {
              sections[currentSectionKey] = (sections[currentSectionKey] ?? '') + buffer
              send({ type: 'delta', section: currentSectionKey, text: buffer })
              buffer = ''
            }
          }
        })

        await anthropicStream.finalMessage()

        // Flush any remaining buffer
        if (currentSectionKey && buffer) {
          const finalKey = currentSectionKey
          sections[finalKey] = (sections[finalKey] ?? '') + buffer
          send({ type: 'delta', section: finalKey, text: buffer })
        }

        // stream_only mode: return sections without saving a new grant record
        if (streamOnly) {
          send({ type: 'done', sections })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          return
        }

        // Save grant + version 1 to database
        const grantId = crypto.randomUUID()
        const grantInsert: Record<string, unknown> = {
          id:                       grantId,
          organization_id:          profile.organization_id,
          funder_name:              form.funder_name,
          opportunity_title:        form.opportunity_title,
          funding_amount_requested: form.funding_amount_requested,
          currency:                 form.currency ?? 'USD',
          application_deadline:     form.application_deadline || null,
          status:                   'draft',
          current_version:          1,
          created_by:               user.id,
        }
        if (programId) grantInsert.program_id = programId

        const { error: grantErr } = await db.from('grants').insert(grantInsert)

        if (grantErr) {
          send({ type: 'error', message: `Database error: ${grantErr.message}` })
          controller.close()
          return
        }

        const { error: versionErr } = await db.from('grant_versions').insert({
          grant_id:         grantId,
          version_number:   1,
          content:          sections,
          generation_inputs: form,
          generated_by:     user.id,
        })

        if (versionErr) {
          send({ type: 'error', message: `Version save error: ${versionErr.message}` })
          controller.close()
          return
        }

        // Fetch the saved grant with versions for the client
        const { data: savedGrant } = await db
          .from('grants')
          .select('*, grant_versions(id, version_number, content, generation_inputs, created_at, generated_by)')
          .eq('id', grantId)
          .single()

        send({ type: 'done', grant: savedGrant })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
