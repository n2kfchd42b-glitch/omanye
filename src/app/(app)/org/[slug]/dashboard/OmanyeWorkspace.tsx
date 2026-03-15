'use client'

import OmanyeApp from '@/components/OmanyeApp'
import type { User } from '@/lib/types'

interface Props {
  initialUser: User
}

// Thin client wrapper so the server component can pass the real auth user
// into OmanyeApp without making the page itself a client component.
export default function OmanyeWorkspace({ initialUser }: Props) {
  return <OmanyeApp initialUser={initialUser} />
}
