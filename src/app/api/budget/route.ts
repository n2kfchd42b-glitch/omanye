// GET  /api/budget?program_id=   — budget summary for a program
// POST /api/budget               — create budget category (NGO_ADMIN | NGO_STAFF)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, notFound, internalError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const programId = req.nextUrl.searchParams.get('program_id')
  if (!programId) return NextResponse.json({ error: 'program_id required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()

  // Verify program belongs to org
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('id', programId)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound()

  const [{ data: categories }, { data: expenditures }, { data: tranches }] = await Promise.all([
    supabase
      .from('budget_categories')
      .select('*')
      .eq('program_id', programId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('expenditures')
      .select('*')
      .eq('program_id', programId)
      .neq('status', 'VOID'),
    supabase
      .from('funding_tranches')
      .select('*')
      .eq('program_id', programId)
      .order('expected_date', { ascending: true }),
  ])

  return NextResponse.json({
    data: {
      categories:   categories   ?? [],
      expenditures: expenditures ?? [],
      tranches:     tranches     ?? [],
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return unauthorized()
  if (!['NGO_ADMIN', 'NGO_STAFF'].includes(profile.role)) return forbidden()

  const body = await req.json()

  // Verify program belongs to org
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('id', body.program_id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!program) return notFound()

  const { data, error } = await supabase
    .from('budget_categories')
    .insert({
      program_id:       body.program_id,
      organization_id:  profile.organization_id,
      name:             body.name,
      allocated_amount: body.allocated_amount ?? 0,
      currency:         body.currency         ?? 'USD',
      description:      body.description      ?? null,
      color:            body.color            ?? null,
      sort_order:       body.sort_order       ?? 0,
      created_by:       user.id,
    })
    .select()
    .single()

  if (error || !data) return internalError(error?.message ?? 'Insert failed')

  return NextResponse.json({ data }, { status: 201 })
}
