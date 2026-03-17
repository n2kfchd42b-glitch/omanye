'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Program } from '@/lib/programs'

interface UseProgramsResult {
  programs: Program[]
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function usePrograms(orgSlug?: string): UseProgramsResult {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [tick,     setTick]     = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!orgSlug) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/programs?org_slug=${encodeURIComponent(orgSlug)}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        if (body.error) {
          setError(body.error)
        } else {
          setPrograms(body.data ?? [])
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [orgSlug, tick])

  return { programs, loading, error, refetch }
}
