import React from 'react'
import { COLORS } from '@/lib/tokens'

interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      React.ReactNode
  compact?:     boolean
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '40px 16px' : '80px 24px',
      }}
    >
      {icon && (
        <div
          style={{
            width: compact ? 40 : 52,
            height: compact ? 40 : 52,
            borderRadius: 16,
            background: COLORS.foam,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: COLORS.stone,
            opacity: 0.7,
            marginBottom: 16,
          }}
        >
          {icon}
        </div>
      )}
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
