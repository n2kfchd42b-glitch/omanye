'use client'

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast, ToastVariant } from '@/lib/types'

// ── Context ───────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

let _toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(Toast & { leaving?: boolean })[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id  = `toast_${++_toastId}`
    const dur = opts.duration ?? 4000
    setToasts(prev => [...prev, { ...opts, id, duration: dur }])
    if (dur > 0) setTimeout(() => dismiss(id), dur)
  }, [dismiss])

  const success = useCallback((title: string, message?: string) => toast({ variant: 'success', title, message, duration: 4000 }), [toast])
  const error   = useCallback((title: string, message?: string) => toast({ variant: 'error',   title, message, duration: 6000 }), [toast])
  const warning = useCallback((title: string, message?: string) => toast({ variant: 'warning', title, message, duration: 5000 }), [toast])
  const info    = useCallback((title: string, message?: string) => toast({ variant: 'info',    title, message, duration: 4000 }), [toast])

  return (
    <ToastCtx.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  )
}

// ── Toast item ────────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: React.ElementType
  iconCls: string
  trackCls: string
}> = {
  success: { icon: CheckCircle2, iconCls: 'text-sage',       trackCls: 'bg-sage'    },
  error:   { icon: XCircle,      iconCls: 'text-red-400',    trackCls: 'bg-red-400' },
  warning: { icon: AlertTriangle,iconCls: 'text-gold',       trackCls: 'bg-gold'    },
  info:    { icon: Info,         iconCls: 'text-blue-400',   trackCls: 'bg-blue-400'},
}

function ToastItem({ t, onDismiss }: { t: Toast & { leaving?: boolean }; onDismiss: (id: string) => void }) {
  const cfg  = VARIANT_CONFIG[t.variant]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 bg-white rounded-xl shadow-toast border border-mist/60 p-4 pr-10 w-80 overflow-hidden',
        t.leaving ? 'animate-toast-out' : 'animate-toast-in'
      )}
      role="alert"
    >
      {/* color track */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', cfg.trackCls)} />
      <Icon size={17} className={cn('flex-shrink-0 mt-0.5', cfg.iconCls)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-forest leading-snug">{t.title}</p>
        {t.message && <p className="text-xs text-fern/60 mt-0.5 leading-snug">{t.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="absolute top-3 right-3 text-fern/30 hover:text-fern transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ── Container ─────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: (Toast & { leaving?: boolean })[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div
      className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2.5"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} t={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
