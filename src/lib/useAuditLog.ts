'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { AuditEntry, AuditAction, AuditResource } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

type AppendEntry = Omit<AuditEntry, 'id' | 'timestamp' | 'ip'>

interface AuditContextValue {
  entries: AuditEntry[]
  append:  (entry: AppendEntry) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuditContext = createContext<AuditContextValue>({
  entries: [],
  append:  () => undefined,
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])

  const append = useCallback((entry: AppendEntry) => {
    const x = Math.floor(Math.random() * 255)
    const y = Math.floor(Math.random() * 255)
    const newEntry: AuditEntry = {
      ...entry,
      id:        Date.now(),
      timestamp: new Date().toISOString(),
      ip:        `192.168.${x}.${y}`,
    }
    setEntries(prev => [newEntry, ...prev])
  }, [])

  return React.createElement(
    AuditContext.Provider,
    { value: { entries, append } },
    children
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuditLog(): AuditContextValue {
  return useContext(AuditContext)
}

export type { AuditAction, AuditResource }
