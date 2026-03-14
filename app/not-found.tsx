import React from 'react'
import Link from 'next/link'
import { OmanyeSymbol } from '@/components/logo/OmanyeLogo'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <OmanyeSymbol size={52} className="mb-4 opacity-30" />
      <h2 className="font-fraunces text-3xl font-semibold text-forest mb-2">Page not found</h2>
      <p className="text-sm text-fern/60 mb-6 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="btn-primary">Back to Dashboard</Link>
    </div>
  )
}
