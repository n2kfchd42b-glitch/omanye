// GET /api/notifications — list own notifications (paginated)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const sp     = req.nextUrl.searchParams
  const limit  = Math.max(1, Math.min(parseInt(sp.get('limit')  ?? '50') || 50, 100))
  const offset = Math.max(0, parseInt(sp.get('offset') ?? '0') || 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error, count } = await db
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}
