import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { COLORS } from '@/lib/tokens'

interface ErrorStateProps {
  title?:       string
  description?: string
  action?:      React.ReactNode
  compact?:     boolean
}

export function ErrorState({
  title       = 'Something went wrong',
  description,
  action,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '40px 16px' : '80px 24px',
      }}
    >
      <div
        style={{
          width: compact ? 40 : 52,
          height: compact ? 40 : 52,
          borderRadius: 16,
          background: 'rgba(192,57,43,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: COLORS.crimson,
          marginBottom: 16,
        }}
      >
        <AlertTriangle size={compact ? 18 : 22} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-fraunces), Georgia, serif',
          fontSize: compact ? 14 : 16,
          fontWeight: 600,
          color: COLORS.slate,
          marginBottom: 4,
        }}
      >
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 13, color: COLORS.stone, maxWidth: 280 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
