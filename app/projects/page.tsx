import React from 'react'
import Link from 'next/link'
import { Plus, Filter, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { AvatarGroup } from '@/components/ui/Avatar'
import { PROJECTS } from '@/lib/mock-data'
import { formatNumber, formatCurrency, pct } from '@/lib/utils'

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold' | 'gray'; label: string }> = {
  active:    { variant: 'green', label: 'Active' },
  pending:   { variant: 'gold',  label: 'Pending' },
  completed: { variant: 'gray',  label: 'Completed' },
}

export const metadata = { title: 'Projects' }

export default function ProjectsPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-subtitle">{PROJECTS.length} projects total · {PROJECTS.filter(p => p.status === 'active').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary gap-1.5">
            <Filter size={13} /> Filter
          </button>
          <button className="btn-primary gap-1.5">
            <Plus size={14} /> New Project
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects…"
          className="input pl-9 max-w-md"
        />
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {PROJECTS.map(p => {
          const sb = STATUS_BADGE[p.status]
          const budgetPct = pct(p.spent, p.budget)

          return (
            <div key={p.id} className="card card-hover p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/projects/${p.id}`}
                    className="font-fraunces text-base font-semibold text-forest hover:text-moss line-clamp-2 leading-snug"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-fern/50 mt-1">{p.region}</p>
                </div>
                <Badge variant={sb.variant} dot>{sb.label}</Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map(t => (
                  <span key={t} className="badge badge-moss text-[10px]">{t}</span>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <ProgressBar
                  label="Beneficiaries"
                  value={pct(p.beneficiaries, p.target)}
                  showPct
                  size="sm"
                />
                <ProgressBar
                  label="Budget spent"
                  value={budgetPct}
                  showPct
                  size="sm"
                  color={budgetPct > 85 ? 'gold' : 'green'}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-mist/60">
                <AvatarGroup names={p.team} max={4} size="xs" />
                <div className="text-right">
                  <p className="text-xs font-mono text-fern/60">
                    {formatNumber(p.beneficiaries)} beneficiaries
                  </p>
                  <p className="text-[10px] text-fern/40">
                    {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
