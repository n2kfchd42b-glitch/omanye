import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AvatarGroup } from '@/components/ui/Avatar'
import { PROJECTS } from '@/lib/mock-data'
import { formatNumber } from '@/lib/utils'

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold' | 'gray'; label: string }> = {
  active:    { variant: 'green', label: 'Active' },
  pending:   { variant: 'gold',  label: 'Pending' },
  completed: { variant: 'gray',  label: 'Completed' },
}

export function ProjectsSnapshot() {
  const shown = PROJECTS.slice(0, 4)

  return (
    <Card>
      <CardHeader
        action={
          <Link href="/projects" className="text-xs text-fern hover:text-moss font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        }
      >
        <CardTitle>Active Projects</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        {shown.map(p => {
          const sb = STATUS_BADGE[p.status]
          return (
            <div key={p.id} className="p-3 rounded-lg border border-mist/60 hover:bg-foam/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/projects/${p.id}`} className="text-sm font-semibold text-forest hover:text-moss line-clamp-1">
                    {p.name}
                  </Link>
                  <p className="text-xs text-fern/50 mt-0.5">{p.region}</p>
                </div>
                <Badge variant={sb.variant} dot>{sb.label}</Badge>
              </div>

              <ProgressBar value={p.progress} showPct size="sm" />

              <div className="flex items-center justify-between mt-2">
                <AvatarGroup names={p.team} max={3} size="xs" />
                <span className="text-xs text-fern/60 font-mono">
                  {formatNumber(p.beneficiaries)} / {formatNumber(p.target)} beneficiaries
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
