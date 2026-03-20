'use client'

// ── Field Layout ───────────────────────────────────────────────────────────────
// Registers the service worker and injects the PWA manifest link.
// next/head is a Pages Router API and does nothing in the App Router;
// we inject the tags directly via DOM manipulation inside useEffect.

import { useEffect } from 'react'

export default function FieldLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ── Manifest link ─────────────────────────────────────────────────────────
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = Object.assign(document.createElement('link'), {
        rel:  'manifest',
        href: '/manifest.webmanifest',
      })
      document.head.appendChild(link)
    }

    // ── PWA meta tags ─────────────────────────────────────────────────────────
    const metas: Record<string, string> = {
      'theme-color':                          '#1B2A4A',
      'mobile-web-app-capable':               'yes',
      'apple-mobile-web-app-capable':         'yes',
      'apple-mobile-web-app-status-bar-style':'black-translucent',
    }
    for (const [name, content] of Object.entries(metas)) {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = Object.assign(document.createElement('meta'), { name, content })
        document.head.appendChild(meta)
      }
    }

    // ── Service Worker ────────────────────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[FieldLayout] SW registration failed:', err))
    }
  }, [])

  return <>{children}</>
}
