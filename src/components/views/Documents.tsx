'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, FileText, Send, MessageSquare } from 'lucide-react'
import { COLORS, FONTS } from '@/lib/tokens'
import { StatusBadge, DocTypeBadge } from '@/components/atoms/Badge'
import { EmptyState } from '@/components/atoms/EmptyState'
import { Avatar }     from '@/components/atoms/Avatar'
import { FormField, Input, Select } from '@/components/atoms/FormField'
import { useModal, ModalFooter } from '@/components/Modal'
import { useToast } from '@/components/Toast'
import { nextId, todayISO } from '@/lib/utils'
import type { Document, DocumentType, DocumentStatus, Comment, User, Program } from '@/lib/types'

// ── New document form ─────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'logframe',  label: 'Logframe'   },
  { value: 'report',    label: 'Report'     },
  { value: 'framework', label: 'Framework'  },
  { value: 'manual',    label: 'Manual'     },
  { value: 'proposal',  label: 'Proposal'   },
  { value: 'other',     label: 'Other'      },
]

const DOC_STATUS_OPTIONS: { value: DocumentStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft'    },
  { value: 'in_review', label: 'In Review'},
  { value: 'approved',  label: 'Approved' },
  { value: 'submitted', label: 'Submitted'},
]

function NewDocForm({ programs, onSave }: { programs: Program[]; onSave: (d: Document) => void }) {
  const { close } = useModal()
  const [name,    setName]    = useState('')
  const [type,    setType]    = useState<DocumentType>('report')
  const [status,  setStatus]  = useState<DocumentStatus>('draft')
  const [program, setProgram] = useState('')

  function handleSave() {
    if (!name.trim()) return
    const progName = programs.find(p => String(p.id) === program)?.name ?? ''
    onSave({
      id: nextId(),
      name: name.trim(),
      type,
      status,
      program: progName,
      updated: todayISO(),
      sections: [],
    })
    close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <FormField label="Document name" required htmlFor="nd-name">
        <Input id="nd-name" placeholder="e.g. Q2 Progress Report" value={name} onChange={e => setName(e.target.value)} />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Type" htmlFor="nd-type">
          <Select id="nd-type" options={DOC_TYPE_OPTIONS} value={type} onChange={e => setType(e.target.value as DocumentType)} />
        </FormField>
        <FormField label="Status" htmlFor="nd-status">
          <Select id="nd-status" options={DOC_STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value as DocumentStatus)} />
        </FormField>
      </div>
      {programs.length > 0 && (
        <FormField label="Related program" htmlFor="nd-prog">
          <Select
            id="nd-prog"
            placeholder="No program link"
            options={programs.map(p => ({ value: String(p.id), label: p.name }))}
            value={program}
            onChange={e => setProgram(e.target.value)}
          />
        </FormField>
      )}
      <ModalFooter>
        <button onClick={close} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, color: COLORS.stone, cursor: 'pointer', border: `1px solid ${COLORS.mist}` }}>Cancel</button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: name.trim() ? COLORS.moss : COLORS.mist,
            color: name.trim() ? '#fff' : COLORS.stone,
            cursor: name.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Create Document
        </button>
      </ModalFooter>
    </div>
  )
}

// ── Documents view ────────────────────────────────────────────────────────────

interface DocumentsProps {
  documents:    Document[]
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>
  programs:     Program[]
  user:         User
}

export function Documents({ documents, setDocuments, programs, user }: DocumentsProps) {
  const { open }    = useModal()
  const { success } = useToast()
  const [selected, setSelected] = useState<Document | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [message,  setMessage]  = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  // Update selected when documents change
  useEffect(() => {
    if (selected) {
      const updated = documents.find(d => d.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [documents])

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [comments])

  function openCreate() {
    open({
      title: 'New Document',
      content: (
        <NewDocForm
          programs={programs}
          onSave={(doc) => {
            setDocuments(prev => [...prev, doc])
            success(`"${doc.name}" created`)
          }}
        />
      ),
    })
  }

  function sendComment() {
    const text = message.trim()
    if (!text || !selected) return
    const c: Comment = {
      id: nextId(),
      author: user.name,
      role: user.role,
      text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
    setComments(prev => [...prev, c])
    setMessage('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FONTS.heading, fontSize: 22, fontWeight: 600, color: COLORS.forest }}>Documents</h2>
          <p style={{ fontSize: 12, color: COLORS.stone, marginTop: 2 }}>{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 8,
            background: COLORS.moss, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New Document
        </button>
      </div>

      <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Document list */}
        <div>
          {documents.length === 0 ? (
            <div className="card" style={{ padding: 0 }}>
              <EmptyState
                icon={<FileText size={24} />}
                title="No documents yet"
                description="Create your first document — reports, logframes, proposals."
                action={
                  <button
                    onClick={openCreate}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 18px', borderRadius: 8,
                      background: COLORS.moss, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Create Document
                  </button>
                }
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => { setSelected(doc); setComments([]) }}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    padding: '14px 16px', borderRadius: 10,
                    background: selected?.id === doc.id ? COLORS.foam : '#fff',
                    border: `1px solid ${selected?.id === doc.id ? COLORS.sage : COLORS.mist}`,
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest, lineHeight: 1.3 }}>{doc.name}</p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <DocTypeBadge type={doc.type} />
                    {doc.program && <span style={{ fontSize: 11, color: COLORS.stone }}>{doc.program}</span>}
                  </div>
                  <p style={{ fontSize: 11, color: COLORS.stone }}>Updated {doc.updated}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card fade-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
            {/* Doc header */}
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${COLORS.mist}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontFamily: FONTS.heading, fontSize: 16, fontWeight: 600, color: COLORS.forest }}>{selected.name}</h3>
                <button onClick={() => setSelected(null)} style={{ fontSize: 11, color: COLORS.stone, cursor: 'pointer' }}>Close</button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <DocTypeBadge type={selected.type} />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {/* Content placeholder */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.mist}`, flex: 1, overflowY: 'auto' }}>
              {selected.sections.length === 0 ? (
                <p style={{ fontSize: 13, color: COLORS.stone, fontStyle: 'italic' }}>No sections added yet.</p>
              ) : (
                selected.sections.map(s => (
                  <div key={s.id} style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.forest }}>{s.title}</p>
                    <p style={{ fontSize: 11, color: COLORS.stone }}>by {s.author}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment thread */}
            <div style={{ borderTop: `1px solid ${COLORS.mist}` }}>
              <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={13} style={{ color: COLORS.stone }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.slate }}>Comments</span>
              </div>

              <div
                ref={chatRef}
                style={{
                  maxHeight: 200, overflowY: 'auto',
                  padding: '0 16px 8px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
                className="scrollbar-hidden"
              >
                {comments.length === 0 ? (
                  <p style={{ fontSize: 12, color: COLORS.stone, fontStyle: 'italic', padding: '8px 0' }}>No comments yet. Start the conversation.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                      <Avatar name={c.author} size={26} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.forest }}>{c.author}</span>
                          <span style={{ fontSize: 10, color: COLORS.stone }}>{c.role}</span>
                          <span style={{ fontSize: 10, color: COLORS.stone }}>{c.time}</span>
                        </div>
                        <p style={{ fontSize: 12, color: COLORS.slate, lineHeight: 1.4 }}>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '8px 16px 14px', display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Add a comment… (Enter to send)"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: `1px solid ${COLORS.mist}`,
                    fontSize: 12, color: COLORS.forest,
                    background: COLORS.snow, outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = COLORS.sage }}
                  onBlur={e  => { e.target.style.borderColor = COLORS.mist }}
                />
                <button
                  onClick={sendComment}
                  disabled={!message.trim()}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: message.trim() ? COLORS.sage : COLORS.mist,
                    color: message.trim() ? '#fff' : COLORS.stone,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
