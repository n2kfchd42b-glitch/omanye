// Load .env.local for smoke tests (works in local dev; in CI use env vars directly)
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

// Validate required env vars before running any test
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `[smoke tests] Missing required environment variable: ${key}\n` +
      `Ensure .env.local is populated or CI env vars are set.`
    )
  }
}
