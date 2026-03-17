'use client'

import React from 'react'
import { ToastProvider } from '@/components/Toast'

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
