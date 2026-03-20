import { requireOrgAuth } from '@/lib/auth/server'
import ProgramsClient from './ProgramsClient'
import type { Program } from '@/lib/programs'

interface Props {
  params: { slug: string }
}

export default async function ProgramsPage({ params }: Props) {
  const { supabase, user, org } = await requireOrgAuth(params.slug)

  const [{ data: programs }, { data: scoreRows }] = await Promise.all([
    supabase
      .from('programs')
      .select('*')
      .eq('organization_id', org.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('program_health_scores')
      .select('program_id, rag_status, composite_score')
      .eq('organization_id', org.id)
      .order('calculated_at', { ascending: false })
      .limit(500),
  ])

  // Deduplicate to latest score per program
  const seen = new Set<string>()
  const healthScores: Record<string, { rag_status: string; composite_score: number }> = {}
  for (const row of (scoreRows ?? []) as Array<{ program_id: string; rag_status: string; composite_score: number }>) {
    if (!seen.has(row.program_id)) {
      seen.add(row.program_id)
      healthScores[row.program_id] = { rag_status: row.rag_status, composite_score: row.composite_score }
    }
  }

  return (
    <ProgramsClient
      programs={(programs ?? []) as Program[]}
      userRole={user.profile.role}
      orgSlug={params.slug}
      healthScores={healthScores}
    />
  )
}
