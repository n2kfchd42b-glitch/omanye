import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'OMANYE — NGO Workspace',
    template: '%s | OMANYE',
  },
  description: 'The NGO Workspace for Field Teams & Impact Reporting',
}

export const viewport: Viewport = {
  themeColor:   '#0D2B1E',
  width:        'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        Font CSS variables are declared in globals.css using system font stacks.
        Swap in next/font/google when network access is available.
      */}
      <body className="antialiased">{children}</body>
    </html>
  )
}
