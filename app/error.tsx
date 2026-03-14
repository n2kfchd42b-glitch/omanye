'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-400 mb-4">
        <AlertTriangle size={24} />
      </div>
      <h2 className="font-fraunces text-xl font-semibold text-forest mb-2">Something went wrong</h2>
      <p className="text-sm text-fern/60 mb-4 max-w-xs">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button onClick={reset} className="btn-primary text-sm">Try again</button>
    </div>
  )
}
