import React from 'react'
import Link from 'next/link'
import { ChevronLeft, MapPin, Calendar, Users } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { PROJECTS } from '@/lib/mock-data'
import { formatNumber, formatCurrency, formatDate, pct } from '@/lib/utils'

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold' | 'gray'; label: string }> = {
  active:    { variant: 'green', label: 'Active' },
  pending:   { variant: 'gold',  label: 'Pending' },
  completed: { variant: 'gray',  label: 'Completed' },
}

export function generateStaticParams() {
  return PROJECTS.map(p => ({ id: p.id }))
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = PROJECTS.find(p => p.id === params.id)
  if (!project) notFound()

  const sb = STATUS_BADGE[project.status]
  const budgetPct = pct(project.spent, project.budget)
  const benefPct  = pct(project.beneficiaries, project.target)

  return (
    <div className="animate-fade-in max-w-4xl">
      {/* Back nav */}
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-fern hover:text-moss mb-4">
        <ChevronLeft size={14} /> Back to Projects
      </Link>

      {/* Title block */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="page-title">{project.name}</h2>
            <Badge variant={sb.variant} dot>{sb.label}</Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-fern/60">
            <span className="flex items-center gap-1"><MapPin size={11} />{project.region}</span>
            <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
            <span className="flex items-center gap-1"><Users size={11} />{project.team.length} team members</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs">Edit</button>
          <button className="btn-primary text-xs">Add Field Data</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Key metrics */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-fern/60 mb-1">
                <span>Beneficiaries reached</span>
                <span className="font-mono">{formatNumber(project.beneficiaries)} / {formatNumber(project.target)}</span>
              </div>
              <ProgressBar value={benefPct} showPct />
            </div>
            <div>
              <div className="flex justify-between text-xs text-fern/60 mb-1">
                <span>Budget utilized</span>
                <span className="font-mono">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
              </div>
              <ProgressBar value={budgetPct} showPct color={budgetPct > 85 ? 'gold' : 'green'} />
            </div>
            <div>
              <div className="flex justify-between text-xs text-fern/60 mb-1">
                <span>Overall completion</span>
                <span className="font-mono">{project.progress}%</span>
              </div>
              <ProgressBar value={project.progress} showPct />
            </div>
          </div>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-fern/50 mb-1.5">Sectors</p>
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map(t => (
                  <span key={t} className="badge badge-moss">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-fern/50 mb-1.5">Project Lead</p>
              <div className="flex items-center gap-2">
                <Avatar name={project.lead} size="sm" />
                <span className="text-sm text-forest">{project.lead}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Team */}
      <Card>
        <CardHeader><CardTitle>Team ({project.team.length})</CardTitle></CardHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {project.team.map(name => (
            <div key={name} className="flex items-center gap-2 p-2 rounded-lg border border-mist/60">
              <Avatar name={name} size="sm" />
              <span className="text-sm text-forest truncate">{name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
