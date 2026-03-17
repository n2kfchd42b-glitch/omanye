'use client'

import type { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  /** 'light' = white card on gray/white bg; 'dark' = navy bg */
  variant?: 'light' | 'dark'
}

export function FeatureCard({ icon, title, description, variant = 'light' }: FeatureCardProps) {
  const isDark = variant === 'dark'

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200 group"
      style={{
        background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
        border: isDark ? '1px solid rgba(212,175,92,0.15)' : '1px solid rgba(15,27,51,0.08)',
        boxShadow: isDark ? 'none' : '0 1px 4px rgba(15,27,51,0.06)',
      }}
      onMouseEnter={(e) => {
        if (!isDark) e.currentTarget.style.boxShadow = '0 8px 30px rgba(15,27,51,0.1)'
        else e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!isDark) e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,27,51,0.06)'
        else e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
        style={{
          background: isDark ? 'rgba(212,175,92,0.15)' : 'rgba(212,175,92,0.1)',
          color: '#D4AF5C',
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          className="font-semibold mb-1.5 text-base"
          style={{
            fontFamily: 'var(--font-fraunces),Georgia,serif',
            color: isDark ? 'white' : '#0F1B33',
          }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{
            fontFamily: 'var(--font-instrument),system-ui,sans-serif',
            color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,27,51,0.6)',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
