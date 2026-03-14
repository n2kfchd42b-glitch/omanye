import React from 'react'
import { Plus, Download, Filter } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { BENEFICIARIES, STATS } from '@/lib/mock-data'
import { formatNumber, formatDate } from '@/lib/utils'

export const metadata = { title: 'Beneficiaries' }

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold' | 'gray' | 'blue'; label: string }> = {
  enrolled:  { variant: 'gold',  label: 'Enrolled' },
  active:    { variant: 'green', label: 'Active' },
  completed: { variant: 'gray',  label: 'Completed' },
}

export default function BeneficiariesPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Beneficiaries</h2>
          <p className="page-subtitle">{formatNumber(STATS.totalBeneficiaries)} total registered across all programs</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary gap-1.5 text-xs">
            <Download size={13} /> Export
          </button>
          <button className="btn-secondary gap-1.5 text-xs">
            <Filter size={13} /> Filter
          </button>
          <button className="btn-primary gap-1.5 text-xs">
            <Plus size={14} /> Register
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     value: formatNumber(STATS.totalBeneficiaries), color: 'text-forest' },
          { label: 'Female',    value: '54%',  color: 'text-fern' },
          { label: 'Male',      value: '46%',  color: 'text-fern' },
          { label: 'This Month',value: '+342', color: 'text-sage' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-fraunces font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-fern/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Region</th>
                <th>Program</th>
                <th>Enrolled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {BENEFICIARIES.map(b => {
                const sb = STATUS_BADGE[b.status]
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={b.name} size="xs" />
                        <span className="font-medium text-forest">{b.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{b.age}</span>
                      <span className="text-fern/50 text-xs"> / {b.gender}</span>
                    </td>
                    <td className="text-fern/70">{b.region}</td>
                    <td>
                      <span className="text-xs text-forest/70 truncate max-w-[180px] block">{b.project}</span>
                    </td>
                    <td className="font-mono text-xs text-fern/60">{formatDate(b.date)}</td>
                    <td>
                      <Badge variant={sb.variant} dot>{sb.label}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination stub */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-mist text-xs text-fern/60">
          <span>Showing 1–10 of {formatNumber(STATS.totalBeneficiaries)}</span>
          <div className="flex gap-1">
            <button className="btn-ghost px-2 py-1 text-xs opacity-50 cursor-not-allowed">Previous</button>
            <button className="btn-ghost px-2 py-1 text-xs">Next</button>
          </div>
        </div>
      </Card>
    </div>
  )
}
