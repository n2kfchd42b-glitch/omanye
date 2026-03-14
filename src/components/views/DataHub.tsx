'use client'

import React, { useState } from 'react'
import { RefreshCw, Plus, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'
import { StatusBadge } from '../atoms/Badge'
import { Avatar }      from '../atoms/Avatar'
import { EmptyState }  from '../atoms/EmptyState'
import { useModal }    from '../Modal'
import { useToast }    from '../Toast'
import { FormField, Input, Select } from '../atoms/FormField'
import { SUBMISSIONS } from '@/lib/mock'
import { formatDate }  from '@/lib/utils'
import type { SubmissionStatus } from '@/lib/types'

const SUMMARY = [
  { label: 'Total',     value: '1,284', Icon: RefreshCw,     cls: 'bg-foam text-fern'       },
  { label: 'Validated', value: '1,186', Icon: CheckCircle2,  cls: 'bg-mist text-sage'        },
  { label: 'Pending',   value: '74',    Icon: Clock,          cls: 'bg-amber-50 text-amber-600'},
  { label: 'Flagged',   value: '24',    Icon: AlertTriangle,  cls: 'bg-red-50 text-red-500'   },
]

const STATUS_FILTER_OPTS = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending',   label: 'Pending' },
  { value: 'validated', label: 'Validated' },
  { value: 'flagged',   label: 'Flagged' },
  { value: 'rejected',  label: 'Rejected' },
]

function NewSubmissionForm({ onClose }: { onClose: () => void }) {
  const { success } = useToast()
  return (
    <div className="space-y-4">
      <FormField label="Form type" htmlFor="ns-type">
        <Select id="ns-type" options={[
          { value: 'household-survey', label: 'Household Survey' },
          { value: 'school-enrollment', label: 'School Enrollment' },
          { value: 'water-audit', label: 'Water Point Audit' },
          { value: 'health-screening', label: 'Health Screening' },
          { value: 'legal-intake', label: 'Legal Case Intake' },
          { value: 'other', label: 'Other' },
        ]} placeholder="Select form type…" />
      </FormField>
      <FormField label="Region" htmlFor="ns-region">
        <Select id="ns-region" options={[
          { value: 'Volta', label: 'Volta' },
          { value: 'Northern', label: 'Northern' },
          { value: 'Ashanti', label: 'Ashanti' },
          { value: 'Accra', label: 'Greater Accra' },
          { value: 'Brong-Ahafo', label: 'Brong-Ahafo' },
        ]} placeholder="Select region…" />
      </FormField>
      <FormField label="Number of records" htmlFor="ns-records">
        <Input id="ns-records" type="number" placeholder="e.g. 42" />
      </FormField>
      <FormField label="Notes" htmlFor="ns-notes">
        <Input id="ns-notes" placeholder="Optional notes about this submission" />
      </FormField>
      <div className="flex justify-end gap-2 pt-2 border-t border-mist">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-mist text-sm text-fern hover:bg-foam transition-colors">Cancel</button>
        <button onClick={() => { success('Submission created', 'New field submission logged successfully.'); onClose() }}
          className="px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
          Submit
        </button>
      </div>
    </div>
  )
}

export function DataHub() {
  const { open, close } = useModal()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = SUBMISSIONS.filter(s =>
    statusFilter === 'all' || s.status === statusFilter
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Data Hub</h2>
          <p className="text-sm text-fern/60 mt-0.5">Validate and manage field submissions</p>
        </div>
        <button
          onClick={() => open({ title: 'New Submission', content: <NewSubmissionForm onClose={close} />, size: 'sm' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors"
        >
          <Plus size={14} /> New Submission
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUMMARY.map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.cls}`}>
              <s.Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-fraunces font-semibold text-forest">{s.value}</p>
              <p className="text-xs text-fern/50">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-mist flex items-center justify-between gap-3">
          <div>
            <p className="font-fraunces text-sm font-semibold text-forest">Recent Submissions</p>
            <p className="text-xs text-fern/50 mt-0.5">Sorted by date · last 30 days</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-mist rounded-lg px-2.5 py-1.5 bg-white text-fern focus:outline-none focus:ring-2 focus:ring-moss/25"
            >
              {STATUS_FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="inline-flex items-center gap-1 text-xs text-fern hover:text-moss transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist bg-snow">
                {['Field Worker', 'Form Type', 'Region', 'Records', 'Submitted', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-fern/55 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(fs => (
                <tr key={fs.id} className="border-b border-mist/40 hover:bg-foam/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={fs.workerName} size="xs" />
                      <span className="font-medium text-forest">{fs.workerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-forest/70">{fs.formType}</td>
                  <td className="px-4 py-3.5 text-fern/70">{fs.region}</td>
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-forest">{fs.records}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-fern/60">{formatDate(fs.submittedAt)}</td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={fs.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="text-xs text-fern hover:text-moss font-medium transition-colors">
                      {fs.status === 'pending' ? 'Validate' : 'Review'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState compact title="No submissions match" description="Try a different status filter." />
        )}
      </div>
    </div>
  )
}
