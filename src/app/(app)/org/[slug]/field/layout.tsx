'use client'

// ── Field Layout ───────────────────────────────────────────────────────────────
// Registers the service worker scoped to /org/*/field/** so offline caching
// only applies to field routes. Also injects the PWA manifest link.

import { useEffect } from 'react'
import Head from 'next/head'

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => {
          // Non-fatal: offline features won't work but the app continues
          console.warn('[FieldLayout] SW registration failed:', err)
        })
    }
  }, [])

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1B2A4A" />
      </Head>
      {children}
    </>
  )
}
