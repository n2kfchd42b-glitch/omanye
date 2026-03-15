import { createClient } from '@/lib/supabase/server'
import { validateInviteToken } from '@/app/actions/donors'
import InviteAcceptClient from './InviteAcceptClient'

interface Props {
  params: { token: string }
}

const ERROR_MESSAGES: Record<string, string> = {
  INVITATION_REVOKED: 'This invitation has been revoked by the organisation.',
  INVITATION_EXPIRED: 'This invitation has expired. Please contact the organisation for a new one.',
  ALREADY_ACCEPTED:   'This invitation has already been accepted.',
}

export default async function InviteAcceptPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await validateInviteToken(params.token)

  // Get current user role if logged in
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  if (result.error || !result.data) {
    const message = ERROR_MESSAGES[result.error ?? ''] ?? 'This invitation link is invalid or has expired.'
    return (
      <InviteAcceptClient
        invitation={null}
        token={params.token}
        isLoggedIn={!!user}
        userRole={userRole}
        errorMessage={message}
      />
    )
  }

  return (
    <InviteAcceptClient
      invitation={result.data}
      token={params.token}
      isLoggedIn={!!user}
      userRole={userRole}
      errorMessage={null}
    />
  )
}
