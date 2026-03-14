import React from 'react'
import { UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { TEAM_MEMBERS } from '@/lib/mock-data'

export const metadata = { title: 'Team' }

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold'; label: string }> = {
  active: { variant: 'green', label: 'Active' },
  away:   { variant: 'gold',  label: 'Away' },
}

export default function TeamPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Team</h2>
          <p className="page-subtitle">{TEAM_MEMBERS.length} members · {TEAM_MEMBERS.filter(t => t.status === 'active').length} active</p>
        </div>
        <button className="btn-primary gap-1.5 text-xs">
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TEAM_MEMBERS.map(t => {
          const sb = STATUS_BADGE[t.status]
          return (
            <div key={t.id} className="card card-hover p-5 flex flex-col items-center text-center gap-3">
              <Avatar name={t.name} size="lg" />
              <div>
                <h3 className="font-fraunces text-sm font-semibold text-forest">{t.name}</h3>
                <p className="text-xs text-fern/60 mt-0.5">{t.role}</p>
                <p className="text-xs text-fern/40 mt-0.5">{t.region}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sb.variant} dot>{sb.label}</Badge>
                <span className="text-xs text-fern/50">{t.projects} project{t.projects !== 1 ? 's' : ''}</span>
              </div>
              <button className="btn-secondary text-xs w-full py-1.5">View Profile</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
