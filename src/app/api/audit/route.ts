// GET /api/audit — paginated, filtered audit log (NGO_ADMIN only)
// Query params: limit, offset, entity_type, actor_id, program_id, search

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  const prof = profile as { role: string; organization_id: string } | null
  if (!prof || prof.role !== 'NGO_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — NGO_ADMIN only' }, { status: 403 })
  }

  const sp          = req.nextUrl.searchParams
  const limit       = Math.min(parseInt(sp.get('limit')  ?? '50'), 100)
  const offset      = parseInt(sp.get('offset')          ?? '0')
  const entityType  = sp.get('entity_type')
  const actorId     = sp.get('actor_id')
  const programId   = sp.get('program_id')
  const search      = sp.get('search')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = adminClient
  let query = db
    .from('audit_log')
    .select('*', { count: 'exact' })
    .eq('organization_id', prof.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) query = query.eq('entity_type', entityType)
  if (actorId)    query = query.eq('actor_id', actorId)
  if (programId) {
    // Filter by program entity or metadata.program_id
    query = query.or(`entity_id.eq.${programId},metadata->>program_id.eq.${programId}`)
  }
  if (search) {
    query = query.or(`entity_name.ilike.%${search}%,action.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count })
}
