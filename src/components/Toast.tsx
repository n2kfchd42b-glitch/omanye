'use client'

import React, { createContext, useContext, useCallback, useState } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { COLORS } from '@/lib/tokens'
import type { ToastVariant, ToastItem } from '@/lib/types'

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastCtxValue {
  toast:   (msg: string, variant?: ToastVariant) => void
  success: (msg: string) => void
  error:   (msg: string) => void
  warn:    (msg: string) => void
}

const ToastCtx = createContext<ToastCtxValue | null>(null)

export function useToast(): ToastCtxValue {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

let _tid = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<(ToastItem & { leaving?: boolean })[]>([])

  const dismiss = useCallback((id: string) => {
    setItems(p => p.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setItems(p => p.filter(t => t.id !== id)), 220)
  }, [])

  const toast = useCallback((msg: string, variant: ToastVariant = 'success') => {
    const id  = `t${++_tid}`
    const dur = variant === 'error' ? 6000 : 3500
    setItems(p => [...p, { id, variant, message: msg, duration: dur }])
    setTimeout(() => dismiss(id), dur)
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{
      toast,
      success: msg => toast(msg, 'success'),
      error:   msg => toast(msg, 'error'),
      warn:    msg => toast(msg, 'warn'),
    }}>
      {children}
      <ToastContainer items={items} onDismiss={dismiss} />
    </ToastCtx.Provider>
  )
}

// ── Toast card ────────────────────────────────────────────────────────────────

const V_CFG: Record<ToastVariant, {
  bg: string; icon: React.ElementType; iconColor: string
}> = {
  // success: dark forest bg (per spec)
  success: { bg: COLORS.forest,  icon: CheckCircle2,  iconColor: COLORS.sage    },
  error:   { bg: COLORS.crimson, icon: AlertCircle,   iconColor: '#ffffff'      },
  warn:    { bg: COLORS.amber,   icon: AlertTriangle, iconColor: '#ffffff'      },
}

function ToastCard({
  item, onDismiss,
}: { item: ToastItem & { leaving?: boolean }; onDismiss: (id: string) => void }) {
  const { bg, icon: Icon, iconColor } = V_CFG[item.variant]
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: bg,
        padding: '12px 14px',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        minWidth: 280, maxWidth: 360,
        position: 'relative',
        color: '#ffffff',
      }}
      className={item.leaving ? 'toast-out' : 'toast-in'}
      role="alert"
    >
      <Icon size={16} style={{ color: iconColor, flexShrink: 0 }} />
      <p style={{ fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        style={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: 0 }}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  )
}

function ToastContainer({
  items, onDismiss,
}: { items: (ToastItem & { leaving?: boolean })[]; onDismiss: (id: string) => void }) {
  if (!items.length) return null
  return (
    <div
      style={{
        position: 'fixed', bottom: 20, right: 20,
        zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8,
      }}
      aria-live="polite"
    >
      {items.map(t => <ToastCard key={t.id} item={t} onDismiss={onDismiss} />)}
    </div>
  )
}
