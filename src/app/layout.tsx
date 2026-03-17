import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/context'

export const metadata: Metadata = {
  title: {
    default:  'OMANYE — NGO Workspace',
    template: '%s | OMANYE',
  },
  description: 'The NGO Workspace for Field Teams, Impact Reporting & Donor Transparency',
}

export const viewport: Viewport = {
  themeColor:   '#0F1B33',
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
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
