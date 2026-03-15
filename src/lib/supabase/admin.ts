// NEVER import this file in client components or expose to the browser.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
