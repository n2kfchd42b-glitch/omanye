'use client'

import { useEffect, useState } from 'react'
import type { SubscriptionResponse } from '@/types/billing'

interface UseLimitsReturn {
  data:     SubscriptionResponse | null
  loading:  boolean
  error:    string | null
  refetch:  () => void
}

export function useLimits(): UseLimitsReturn {
  const [data,    setData]    = useState<SubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/billing/subscription')
      .then(r => r.json())
      .then(json => {
        if (cancelled) return
        if (json.error) setError(json.message ?? json.error)
        else setData(json)
      })
      .catch(err => {
        if (!cancelled) setError(err.message ?? 'Failed to load subscription')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  return { data, loading, error, refetch: () => setTick(t => t + 1) }
}
