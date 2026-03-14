import React from 'react'
import { Plus, Landmark } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'

export const metadata = { title: 'Grants' }

const GRANTS = [
  {
    id: 'g1',
    title: 'EU-EUTF Rural Resilience Grant',
    donor: 'European Union',
    amount: 300_000,
    received: 120_000,
    deadline: '2024-09-30',
    status: 'active',
    phase: 'Year 1 of 2',
  },
  {
    id: 'g2',
    title: 'USAID Community Development Window',
    donor: 'USAID',
    amount: 400_000,
    received: 400_000,
    deadline: '2024-03-31',
    status: 'completed',
    phase: 'Final',
  },
  {
    id: 'g3',
    title: 'Ford Foundation — Education Equity',
    donor: 'Ford Foundation',
    amount: 150_000,
    received: 75_000,
    deadline: '2024-12-31',
    status: 'active',
    phase: 'Year 1 of 3',
  },
  {
    id: 'g4',
    title: 'GFATM Health Systems Strengthening',
    donor: 'Global Fund',
    amount: 220_000,
    received: 0,
    deadline: '2024-08-01',
    status: 'pending',
    phase: 'Application',
  },
]

const STATUS_BADGE: Record<string, { variant: 'green' | 'gold' | 'gray' }> = {
  active:    { variant: 'green' },
  completed: { variant: 'gray'  },
  pending:   { variant: 'gold'  },
}

function fmtCur(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}
function pct(a: number, b: number) { return b ? Math.round((a / b) * 100) : 0 }

export default function GrantsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Grants</h2>
          <p className="page-subtitle">{GRANTS.length} grants tracked · {GRANTS.filter(g => g.status === 'active').length} active</p>
        </div>
        <button className="btn-primary gap-1.5 text-xs">
          <Plus size={14} /> Add Grant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {GRANTS.map(g => {
          const sb = STATUS_BADGE[g.status]
          const p = pct(g.received, g.amount)
          return (
            <div key={g.id} className="card card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-foam flex items-center justify-center flex-shrink-0 text-fern">
                  <Landmark size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-fraunces text-sm font-semibold text-forest">{g.title}</h3>
                    <Badge variant={sb.variant} dot>
                      {g.status === 'active' ? 'Active' : g.status === 'completed' ? 'Closed' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-fern/50 mt-0.5">{g.donor} · {g.phase}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-fern/60">
                  <span>Funds received</span>
                  <span className="font-mono">{fmtCur(g.received)} / {fmtCur(g.amount)}</span>
                </div>
                <ProgressBar value={p} size="sm" />
              </div>

              <div className="flex justify-between text-xs text-fern/60 pt-1 border-t border-mist/60">
                <span>Deadline</span>
                <span className="font-mono">{g.deadline}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
