import React from 'react'
import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DONORS } from '@/lib/mock-data'
import { formatCurrency, pct } from '@/lib/utils'

export const metadata = { title: 'Donors' }

const STATUS_BADGE: Record<string, { variant: 'green' | 'gray' }> = {
  active:    { variant: 'green' },
  completed: { variant: 'gray'  },
}

const TYPE_BADGE: Record<string, { variant: 'blue' | 'gold' | 'moss' | 'gray' }> = {
  Foundation: { variant: 'blue' },
  Government: { variant: 'gold' },
  Individual: { variant: 'moss' },
  Corporate:  { variant: 'gray' },
}

const totalCommitted = DONORS.reduce((s, d) => s + d.amount, 0)
const totalReceived  = DONORS.reduce((s, d) => s + d.given,  0)

export default function DonorsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Donors</h2>
          <p className="page-subtitle">{DONORS.length} donor relationships · {DONORS.filter(d => d.status === 'active').length} active</p>
        </div>
        <button className="btn-primary gap-1.5 text-xs">
          <Plus size={14} /> Add Donor
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Committed', value: formatCurrency(totalCommitted), accent: 'text-forest' },
          { label: 'Total Received',  value: formatCurrency(totalReceived),  accent: 'text-sage'   },
          { label: 'Foundations',     value: DONORS.filter(d => d.type === 'Foundation').length, accent: 'text-fern' },
          { label: 'Governments',     value: DONORS.filter(d => d.type === 'Government').length, accent: 'text-gold' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-fraunces font-semibold ${s.accent}`}>{s.value}</p>
            <p className="text-xs text-fern/50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Donor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DONORS.map(d => {
          const disbursedPct = pct(d.given, d.amount)
          const sb = STATUS_BADGE[d.status]
          const tb = TYPE_BADGE[d.type] ?? { variant: 'gray' as const }

          return (
            <div key={d.id} className="card card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-fraunces text-sm font-semibold text-forest">{d.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant={tb.variant}>{d.type}</Badge>
                    <span className="text-xs text-fern/50">{d.country}</span>
                  </div>
                </div>
                <Badge variant={sb.variant} dot>
                  {d.status === 'active' ? 'Active' : 'Closed'}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-fern/60">
                  <span>Disbursement</span>
                  <span className="font-mono">{formatCurrency(d.given)} / {formatCurrency(d.amount)}</span>
                </div>
                <ProgressBar value={disbursedPct} size="sm" color={disbursedPct >= 100 ? 'green' : 'green'} />
              </div>

              <div className="flex items-center justify-between text-xs text-fern/60 pt-1 border-t border-mist/60">
                <span>{d.projects.length} project{d.projects.length !== 1 ? 's' : ''}</span>
                <span className="font-mono">Last gift: {d.lastGift}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
