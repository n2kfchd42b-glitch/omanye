'use client'

import React, { useState, useRef } from 'react'
import { Plus, Upload, Link2, Database, RefreshCw } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, SourceBadge } from '@/components/atoms/Badge'
import { EmptyState }  from '@/components/atoms/EmptyState'
import { FormField, Input, Select } from '@/components/atoms/FormField'
import { useModal, ModalFooter } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { nextId, todayISO } from '@/lib/utils'
import type { Dataset, DataSource, Program } from '@/lib/types'

// ── Integration cards config ──────────────────────────────────────────────────

interface Integration {
  source:  DataSource
  label:   string
  desc:    string
  color:   string
  icon:    string
}

const INTEGRATIONS: Integration[] = [
  {
    source: 'KoBoToolbox',
    label:  'KoBoToolbox',
    desc:   'Connect your KoBoToolbox account to sync form submissions automatically.',
    color:  '#0369A1',
    icon:   'K',
  },
  {
    source: 'REDCap',
    label:  'REDCap',
    desc:   'Import datasets from your REDCap project via API token.',
    color:  '#1A5C3A',
    icon:   'R',
  },
  {
    source: 'ODK Central',
    label:  'ODK Central',
    desc:   'Sync submissions from ODK Central server.',
    color:  '#D97706',
    icon:   'O',
  },
]

// ── Connect modal ─────────────────────────────────────────────────────────────

function ConnectForm({ integration, onSave }: { integration: Integration; onSave: (d: Dataset) => void }) {
  const { close } = useModal()
  const [url,   setUrl]   = useState('')
  const [token, setToken] = useState('')
  const [name,  setName]  = useState('')

  function handleConnect() {
    if (!url.trim() || !token.trim()) return
    const ds: Dataset = {
      id: nextId(),
      name: name.trim() || `${integration.label} Dataset`,
      source: integration.source,
      rows: '—',
      cols: '—',
      size: '—',
      status: 'processing',
      updated: todayISO(),
    }
    onSave(ds)
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Info box */}
      <div style={{
        background: COLORS.foam, borderRadius: 8, padding: '10px 14px',
        border: `1px solid ${COLORS.mist}`,
        fontSize: 12, color: COLORS.slate, lineHeight: 1.5,
      }}>
        Enter your {integration.label} server URL and API token. Your credentials are stored securely and never shared.
      </div>

      <FormField label="Dataset name" htmlFor="cf-name">
        <Input id="cf-name" placeholder={`${integration.label} Dataset`} value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <FormField label="Server URL" required htmlFor="cf-url">
        <Input id="cf-url" type="url" placeholder="https://your-server.example.com" value={url} onChange={e => setUrl(e.target.value)} />
      </FormField>
      <FormField label="API Token" required htmlFor="cf-token">
        <Input id="cf-token" type="password" placeholder="Paste your API token…" value={token} onChange={e => setToken(e.target.value)} />
      </FormField>

      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleConnect}
          disabled={!url.trim() || !token.trim()}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: url.trim() && token.trim() ? COLORS.moss : COLORS.mist,
            color: url.trim() && token.trim() ? '#fff' : COLORS.stone,
            cursor: url.trim() && token.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Connect Source
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Upload modal ──────────────────────────────────────────────────────────────

function UploadForm({ programs, onSave }: { programs: Program[]; onSave: (d: Dataset) => void }) {
  const { close } = useModal()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver,   setDragOver]   = useState(false)
  const [file,       setFile]       = useState<File | null>(null)
  const [name,       setName]       = useState('')
  const [programId,  setProgramId]  = useState('')

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, '')) }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, '')) }
  }

  function handleUpload() {
    if (!file) return
    const ds: Dataset = {
      id: nextId(),
      name: name.trim() || file.name,
      source: 'Upload',
      rows: '—',
      cols: '—',
      size: file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.round(file.size / 1000)} KB`,
      status: 'processing',
      updated: todayISO(),
      programId: programId ? Number(programId) : undefined,
    }
    onSave(ds)
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? COLORS.sage : COLORS.mist}`,
          borderRadius: 12,
          background: dragOver ? COLORS.foam : COLORS.snow,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <Upload size={20} style={{ color: dragOver ? COLORS.sage : COLORS.stone, margin: '0 auto 10px' }} />
        {file ? (
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{file.name}</p>
        ) : (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.slate }}>Drop CSV or Excel here</p>
            <p style={{ fontSize: 11, color: COLORS.stone, marginTop: 4 }}>or click to browse</p>
          </>
        )}
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={onPickFile} />
      </div>

      <FormField label="Dataset name" htmlFor="uf-name">
        <Input id="uf-name" placeholder="Dataset name" value={name} onChange={e => setName(e.target.value)} />
      </FormField>

      {programs.length > 0 && (
        <FormField label="Link to program" htmlFor="uf-prog">
          <Select
            id="uf-prog"
            placeholder="No program link"
            options={programs.map(p => ({ value: String(p.id), label: p.name }))}
            value={programId}
            onChange={e => setProgramId(e.target.value)}
          />
        </FormField>
      )}

      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleUpload}
          disabled={!file}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: file ? COLORS.moss : COLORS.mist,
            color: file ? '#fff' : COLORS.stone,
            cursor: file ? 'pointer' : 'not-allowed',
          }}
        >
          Upload Dataset
        </button>
      </ModalFooter>
    </div>
  )
}

// ── DataHub view ──────────────────────────────────────────────────────────────

interface DataHubProps {
  datasets:    Dataset[]
  setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>
  programs:    Program[]
}

export function DataHub({ datasets, setDatasets, programs }: DataHubProps) {
  const { open }    = useModal()
  const { success } = useToast()

  function openConnect(integration: Integration) {
    open({
      title: `Connect ${integration.label}`,
      content: (
        <ConnectForm
          integration={integration}
          onSave={(ds) => {
            setDatasets(prev => [...prev, ds])
            success(`${integration.label} connected`)
          }}
        />
      ),
    })
  }

  function openUpload() {
    open({
      title: 'Upload Dataset',
      content: (
        <UploadForm
          programs={programs}
          onSave={(ds) => {
            setDatasets(prev => [...prev, ds])
            success(`"${ds.name}" uploaded`)
          }}
        />
      ),
    })
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Data Hub</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openUpload}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: COLORS.moss, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Upload size={14} /> Upload Dataset
        </button>
      </div>

      {/* Integration cards */}
      <div className="fade-up-1" style={{ marginBottom: 32 }}>
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 14 }}>
          Connect a Source
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {INTEGRATIONS.map(intg => (
            <IntegrationCard key={intg.source} integration={intg} onConnect={() => openConnect(intg)} />
          ))}
        </div>
      </div>

      {/* Dataset list */}
      <div className="fade-up-2">
        <h3 style={{ fontFamily: FONTS.heading, fontSize: 15, fontWeight: 600, color: COLORS.forest, marginBottom: 14 }}>
          Datasets
        </h3>
        {datasets.length === 0 ? (
          <div className="card" style={{ padding: 0 }}>
            <EmptyState
              icon={<Database size={24} />}
              title="No datasets yet"
              description="Connect a data source above or upload a CSV file."
            />
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLORS.snow }}>
                  {['Name', 'Source', 'Rows', 'Size', 'Status', 'Updated', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: COLORS.stone, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datasets.map((ds, i) => (
                  <tr key={ds.id} style={{ borderTop: `1px solid ${COLORS.mist}`, background: i % 2 === 0 ? '#fff' : COLORS.snow }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: COLORS.forest }}>{ds.name}</td>
                    <td style={{ padding: '12px 16px' }}><SourceBadge source={ds.source} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate }}>{ds.rows}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: COLORS.slate }}>{ds.size}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={ds.status} /></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: COLORS.stone }}>{ds.updated}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => {
                          setDatasets(prev => prev.map(d => d.id === ds.id ? { ...d, status: 'processing' } : d))
                        }}
                        style={{ color: COLORS.stone, cursor: 'pointer' }}
                        title="Refresh"
                      >
                        <RefreshCw size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── IntegrationCard ───────────────────────────────────────────────────────────

function IntegrationCard({ integration: intg, onConnect }: { integration: Integration; onConnect: () => void }) {
  return (
    <div className="card card-hover" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: intg.color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: intg.color,
        }}>
          {intg.icon}
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.forest }}>{intg.label}</p>
      </div>
      <p style={{ fontSize: 12, color: COLORS.stone, lineHeight: 1.5, marginBottom: 14 }}>{intg.desc}</p>
      <button
        onClick={onConnect}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, width: '100%', justifyContent: 'center',
          background: COLORS.foam, color: COLORS.fern,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${COLORS.mist}`,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = COLORS.mist)}
        onMouseLeave={e => (e.currentTarget.style.background = COLORS.foam)}
      >
        <Link2 size={13} /> Connect Source
      </button>
    </div>
  )
}
