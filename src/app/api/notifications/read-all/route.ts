// PATCH /api/notifications/read-all — mark all own notifications as read

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', user.id)
    .eq('read', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
