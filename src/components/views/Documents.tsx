'use client'

import React, { useState } from 'react'
import { FileText, Plus, Download, Search } from 'lucide-react'
import { StatusBadge } from '../atoms/Badge'
import { Avatar }      from '../atoms/Avatar'
import { EmptyState }  from '../atoms/EmptyState'
import { useModal }    from '../Modal'
import { useToast }    from '../Toast'
import { FormField, Input, Select } from '../atoms/FormField'
import { DOCUMENTS }   from '@/lib/mock'
import { formatDate }  from '@/lib/utils'
import type { Document } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  report:     'Report',
  proposal:   'Proposal',
  mou:        'MOU',
  budget:     'Budget',
  assessment: 'Assessment',
  other:      'Other',
}

const FORMAT_CLS: Record<string, string> = {
  PDF:  'bg-red-50 text-red-600',
  XLSX: 'bg-green-50 text-green-700',
  DOCX: 'bg-blue-50 text-blue-600',
  CSV:  'bg-amber-50 text-amber-700',
}

function fmtKb(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const { success } = useToast()
  const [title, setTitle] = useState('')
  return (
    <div className="space-y-4">
      <FormField label="Document title" required htmlFor="doc-title">
        <Input id="doc-title" placeholder="e.g. Q2 Impact Report" value={title} onChange={e => setTitle(e.target.value)} />
      </FormField>
      <FormField label="Document type" htmlFor="doc-type">
        <Select id="doc-type" options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} placeholder="Select type…" />
      </FormField>
      <FormField label="Related program" htmlFor="doc-prog">
        <Select id="doc-prog" options={[
          { value: '', label: 'Organisation-wide' },
          { value: 'p1', label: 'Clean Water Initiative' },
          { value: 'p2', label: "Girls' Education Access" },
          { value: 'p3', label: 'Community Health Workers' },
        ]} placeholder="Select program…" />
      </FormField>
      <div className="rounded-xl border-2 border-dashed border-mist bg-foam/40 p-6 text-center">
        <p className="text-sm text-fern/60">Drag & drop or <span className="text-fern font-semibold underline cursor-pointer">browse</span></p>
        <p className="text-xs text-fern/40 mt-1">PDF, XLSX, DOCX · max 10 MB</p>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-mist">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-mist text-sm text-fern hover:bg-foam transition-colors">Cancel</button>
        <button onClick={() => { success('Document uploaded', `"${title || 'Document'}" added successfully.`); onClose() }}
          className="px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors">
          Upload
        </button>
      </div>
    </div>
  )
}

export function Documents() {
  const { open, close } = useModal()
  const [search,   setSearch]   = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = DOCUMENTS.filter(d => {
    const matchType   = typeFilter === 'all' || d.type === typeFilter
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const types = ['all', ...Array.from(new Set(DOCUMENTS.map(d => d.type)))]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-fraunces text-2xl font-semibold text-forest">Documents</h2>
          <p className="text-sm text-fern/60 mt-0.5">{DOCUMENTS.length} documents</p>
        </div>
        <button
          onClick={() => open({ title: 'Upload Document', content: <UploadForm onClose={close} />, size: 'sm' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-moss text-white text-sm font-semibold hover:bg-fern transition-colors"
        >
          <Plus size={14} /> Upload
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fern/40 pointer-events-none" />
          <input type="text" placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-mist bg-white text-forest placeholder:text-forest/35 focus:outline-none focus:ring-2 focus:ring-moss/25 focus:border-moss w-52" />
        </div>
        <div className="flex gap-1 bg-foam rounded-lg p-1 border border-mist/60">
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                typeFilter === t ? 'bg-white text-forest shadow-sm' : 'text-fern/60 hover:text-fern'
              }`}>
              {t === 'all' ? 'All' : TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="No documents found" description="Upload a new document or adjust your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="card card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-foam flex items-center justify-center flex-shrink-0 text-fern">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-fraunces text-sm font-semibold text-forest line-clamp-2 leading-snug">{d.title}</h3>
                  <p className="text-xs text-fern/50 mt-0.5">{TYPE_LABELS[d.type]} · {fmtKb(d.sizeKb)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={d.status} />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${FORMAT_CLS[d.format] ?? 'bg-gray-100 text-gray-600'}`}>
                  {d.format}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-mist/60">
                <div className="flex items-center gap-1.5">
                  <Avatar name={d.author} size="xs" />
                  <span className="text-xs text-fern/60">{d.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-fern/50">{formatDate(d.updatedAt)}</span>
                  {d.status === 'published' && (
                    <button className="text-fern hover:text-moss transition-colors" aria-label="Download">
                      <Download size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
