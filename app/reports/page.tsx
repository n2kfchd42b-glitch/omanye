import React from 'react'
import { Plus, FileText, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { REPORTS } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Impact Reports' }

const STATUS_CONFIG: Record<string, { variant: 'green' | 'gold' | 'gray' | 'blue'; label: string }> = {
  published: { variant: 'green', label: 'Published' },
  draft:     { variant: 'gray',  label: 'Draft'     },
  review:    { variant: 'gold',  label: 'In Review' },
  submitted: { variant: 'blue',  label: 'Submitted' },
}

const FORMAT_COLOR: Record<string, string> = {
  PDF:  'badge badge-blue',
  XLSX: 'badge badge-moss',
  DOCX: 'badge badge-gray',
}

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Impact Reports</h2>
          <p className="page-subtitle">{REPORTS.length} reports this quarter</p>
        </div>
        <button className="btn-primary gap-1.5 text-xs">
          <Plus size={14} /> Generate Report
        </button>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map(r => {
          const sc = STATUS_CONFIG[r.status]
          return (
            <div key={r.id} className="card card-hover p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-foam flex items-center justify-center flex-shrink-0 text-fern">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-fraunces text-sm font-semibold text-forest line-clamp-2 leading-snug">
                    {r.title}
                  </h3>
                  <p className="text-xs text-fern/50 mt-0.5">{r.project}</p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={sc.variant} dot>{sc.label}</Badge>
                <span className={FORMAT_COLOR[r.format] ?? 'badge badge-gray'}>{r.format}</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-mist/60">
                <div className="flex items-center gap-2">
                  <Avatar name={r.author} size="xs" />
                  <span className="text-xs text-fern/60">{r.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-fern/50">{formatDate(r.date)}</span>
                  {r.status === 'published' && (
                    <button className="text-fern hover:text-moss" aria-label="Download">
                      <Download size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
