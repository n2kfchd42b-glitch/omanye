// GET  /api/notifications/preferences — get user's preferences
// PATCH /api/notifications/preferences — update preferences

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferences } from '@/types/audit'
import { HIGH_PRIORITY_TYPES } from '@/types/audit'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Return defaults if no row yet
  if (!data) {
    return NextResponse.json({
      data: {
        profile_id:               user.id,
        email_notifications:      true,
        notify_program_updates:   true,
        notify_indicator_updates: true,
        notify_expenditures:      true,
        notify_reports:           true,
        notify_field_submissions: false,
        notify_team_changes:      true,
        notify_donor_activity:    true,
        notify_budget_warnings:   true,
      },
    })
  }

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json() as Partial<NotificationPreferences>

  // HIGH priority notifications cannot be disabled — enforce here
  // notify_budget_warnings covers BUDGET_WARNING (HIGH)
  // notify_indicator_updates covers INDICATOR_OFF_TRACK (HIGH)
  // notify_donor_activity covers DONOR_ACCESS_REQUESTED (HIGH)
  const enforced: Partial<NotificationPreferences> = { ...body }
  if (HIGH_PRIORITY_TYPES.includes('INDICATOR_OFF_TRACK'))  enforced.notify_indicator_updates = true
  if (HIGH_PRIORITY_TYPES.includes('BUDGET_WARNING'))       enforced.notify_budget_warnings   = true
  if (HIGH_PRIORITY_TYPES.includes('DONOR_ACCESS_REQUESTED')) enforced.notify_donor_activity  = true

  // Remove read-only fields
  delete enforced.id
  delete enforced.profile_id
  delete enforced.created_at
  delete enforced.updated_at

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = supabase
  const { data, error } = await db
    .from('notification_preferences')
    .upsert({ ...enforced, profile_id: user.id }, { onConflict: 'profile_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
