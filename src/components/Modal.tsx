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

// ── ModalFooter ───────────────────────────────────────────────────────────────

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 8,
      padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px)',
      borderTop: `1px solid ${COLORS.mist}`,
      flexShrink: 0,
    }}>
      {children}
    </div>
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
        // On narrow screens: 8px side padding so modal never bleeds to edge
        padding: 'max(8px, env(safe-area-inset-top, 8px)) 8px max(8px, env(safe-area-inset-bottom, 8px)) 8px',
        background: 'rgba(0,0,0,0.7)',
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
          background: '#1A2B4A',
          borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          // Cap height so it never overflows the screen
          maxHeight: 'calc(100dvh - 16px)',
          display: 'flex', flexDirection: 'column',
        }}
        className={modal.visible ? 'fade-up' : ''}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            // Responsive padding: tighter on small screens
            padding: 'clamp(12px, 3vw, 18px) clamp(16px, 4vw, 24px)',
            borderBottom: `1px solid ${COLORS.mist}`,
            flexShrink: 0,
          }}
        >
          <h2
            id="modal-title"
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontSize: 'clamp(15px, 4vw, 18px)',
              fontWeight: 600,
              color: '#FFFFFF',
              margin: 0,
            }}
          >
            {modal.title}
          </h2>
          {/* Close button: visually 28px, touch target 44px via padding */}
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              // Negative margin so the 44px touch area doesn't push layout
              width: 44, height: 44, margin: '-8px -8px -8px 8px',
              borderRadius: 8,
              color: COLORS.stone, cursor: 'pointer',
              transition: 'background 0.15s',
              background: 'transparent',
              border: 'none',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = COLORS.foam)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 'clamp(14px, 3vw, 20px) clamp(16px, 4vw, 24px)',
        }}>
          {modal.content}
        </div>
      </div>
    </div>
  )
}
