'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { COLORS } from '@/lib/tokens'

// ── Context ───────────────────────────────────────────────────────────────────

interface ModalConfig {
  title:   string
  content: React.ReactNode
  wide?:   boolean          // 720px vs 520px
  onClose?: () => void
}

interface ModalCtxValue {
  open:  (cfg: ModalConfig) => void
  close: () => void
}

const ModalCtx = createContext<ModalCtxValue | null>(null)

export function useModal(): ModalCtxValue {
  const ctx = useContext(ModalCtx)
  if (!ctx) throw new Error('useModal must be inside ModalProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<(ModalConfig & { visible: boolean }) | null>(null)

  const open  = useCallback((cfg: ModalConfig) => setModal({ ...cfg, visible: true }), [])
  const close = useCallback(() => {
    setModal(p => p ? { ...p, visible: false } : null)
    setTimeout(() => setModal(null), 180)
  }, [])

  useEffect(() => {
    if (!modal?.visible) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [modal?.visible, close])

  return (
    <ModalCtx.Provider value={{ open, close }}>
      {children}
      {modal && <ModalRoot modal={modal} onClose={() => { modal.onClose?.(); close() }} />}
    </ModalCtx.Provider>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

function ModalRoot({
  modal, onClose,
}: { modal: ModalConfig & { visible: boolean }; onClose: () => void }) {
  const maxW = modal.wide ? 720 : 520
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: `rgba(10,26,16,0.6)`,
        backdropFilter: 'blur(2px)',
      }}
      className={modal.visible ? 'fade-up' : ''}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          width: '100%', maxWidth: maxW,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(10,26,16,0.22)',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
        className={modal.visible ? 'fade-up' : ''}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `1px solid ${COLORS.mist}`,
            flexShrink: 0,
          }}
        >
          <h2
            id="modal-title"
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: 18, fontWeight: 600, color: COLORS.forest,
            }}
          >
            {modal.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.stone, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {modal.content}
        </div>
      </div>
    </div>
  )
}

// ── ModalFooter helper ────────────────────────────────────────────────────────

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: 8, paddingTop: 16,
        borderTop: `1px solid ${COLORS.mist}`,
        marginTop: 16,
      }}
    >
      {children}
    </div>
  )
}
