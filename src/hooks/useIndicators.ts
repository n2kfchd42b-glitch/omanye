'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Indicator } from '@/lib/programs'

interface UseIndicatorsResult {
  indicators: Indicator[]
  loading:    boolean
  error:      string | null
  refetch:    () => void
}

export function useIndicators(programId?: string): UseIndicatorsResult {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [tick,       setTick]       = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!programId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/indicators?program_id=${encodeURIComponent(programId)}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        if (body.error) {
          setError(body.error)
        } else {
          setIndicators(body.data ?? [])
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [programId, tick])

  return { indicators, loading, error, refetch }
}
