import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-snow">
      <Sidebar />
      <Header />
      <main
        className="min-h-screen pt-[60px]"
        style={{ paddingLeft: 'var(--sidebar-w)' }}
      >
        <div className="p-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
