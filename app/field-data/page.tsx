import React from 'react'
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardSubtitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { FIELD_SUBMISSIONS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Field Data' }

const STATUS_CONFIG: Record<string, {
  variant: 'green' | 'gold' | 'red' | 'gray'
  label: string
  icon: React.ElementType
}> = {
  validated: { variant: 'green', label: 'Validated', icon: CheckCircle2 },
  pending:   { variant: 'gold',  label: 'Pending',   icon: Clock },
  flagged:   { variant: 'red',   label: 'Flagged',   icon: AlertTriangle },
}

const summary = [
  { label: 'Total Submissions', value: '1,284', icon: RefreshCw, color: 'text-fern bg-foam' },
  { label: 'Validated',         value: '1,186', icon: CheckCircle2, color: 'text-sage bg-mist' },
  { label: 'Pending Review',    value: '74',    icon: Clock,       color: 'text-gold bg-amber-50' },
  { label: 'Flagged',           value: '24',    icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
]

export default function FieldDataPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Field Data</h2>
          <p className="page-subtitle">Review and validate submissions from field workers</p>
        </div>
        <button className="btn-primary gap-1.5 text-xs">
          <Plus size={14} /> New Submission
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summary.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-lg font-fraunces font-semibold text-forest">{s.value}</p>
                <p className="text-xs text-fern/50">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-mist flex items-center justify-between">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <CardSubtitle>Last 30 days · sorted by date</CardSubtitle>
          </div>
          <button className="btn-ghost text-xs gap-1">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Field Worker</th>
                <th>Type</th>
                <th>Region</th>
                <th>Records</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {FIELD_SUBMISSIONS.map(fs => {
                const sc = STATUS_CONFIG[fs.status]
                const Icon = sc.icon
                return (
                  <tr key={fs.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fs.worker} size="xs" />
                        <span className="font-medium text-forest">{fs.worker}</span>
                      </div>
                    </td>
                    <td className="text-forest/70">{fs.type}</td>
                    <td className="text-fern/70">{fs.region}</td>
                    <td>
                      <span className="font-mono text-xs font-semibold text-forest">{fs.records}</span>
                    </td>
                    <td className="font-mono text-xs text-fern/60">{formatDate(fs.date)}</td>
                    <td>
                      <Badge variant={sc.variant} dot>
                        {sc.label}
                      </Badge>
                    </td>
                    <td>
                      <button className="text-xs text-fern hover:text-moss font-medium">
                        Review
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
