'use client'

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Context ───────────────────────────────────────────────────────────────────

interface ModalConfig {
  title:    string
  content:  React.ReactNode
  size?:    'sm' | 'md' | 'lg' | 'xl'
  onClose?: () => void
}

interface ModalContextValue {
  open:  (config: ModalConfig) => void
  close: () => void
}

const ModalCtx = createContext<ModalContextValue | null>(null)

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalCtx)
  if (!ctx) throw new Error('useModal must be used inside <ModalProvider>')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<(ModalConfig & { visible: boolean }) | null>(null)

  const open  = useCallback((cfg: ModalConfig) => setModal({ ...cfg, visible: true }),  [])
  const close = useCallback(() => {
    setModal(prev => prev ? { ...prev, visible: false } : null)
    setTimeout(() => setModal(null), 200)
  }, [])

  // Esc to close
  useEffect(() => {
    if (!modal?.visible) return
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [modal?.visible, close])

  return (
    <ModalCtx.Provider value={{ open, close }}>
      {children}
      {modal && (
        <ModalRoot modal={modal} onClose={() => { modal.onClose?.(); close() }} />
      )}
    </ModalCtx.Provider>
  )
}

// ── Modal root ────────────────────────────────────────────────────────────────

const SIZE_CLS: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

interface ModalRootProps {
  modal:   ModalConfig & { visible: boolean }
  onClose: () => void
}

function ModalRoot({ modal, onClose }: ModalRootProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4',
        modal.visible ? 'animate-fade-in' : 'opacity-0 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-forest/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-modal flex flex-col max-h-[90vh]',
          SIZE_CLS[modal.size ?? 'md'],
          modal.visible ? 'animate-slide-up' : ''
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mist flex-shrink-0">
          <h2 id="modal-title" className="font-fraunces text-lg font-semibold text-forest">
            {modal.title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-fern/40 hover:text-fern hover:bg-foam transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {modal.content}
        </div>
      </div>
    </div>
  )
}

// ── ModalFooter helper ────────────────────────────────────────────────────────

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-4 border-t border-mist mt-4', className)}>
      {children}
    </div>
  )
}
