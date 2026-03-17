'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

interface PlanCardProps {
  name: string
  price: { monthly: number; annual: number }
  description: string
  features: string[]
  cta: { label: string; href: string }
  highlighted?: boolean
  badge?: string
  billing: 'monthly' | 'annual'
}

export function PlanCard({
  name,
  price,
  description,
  features,
  cta,
  highlighted = false,
  badge,
  billing,
}: PlanCardProps) {
  const displayPrice = billing === 'annual'
    ? Math.round(price.annual / 12)
    : price.monthly

  return (
    <div
      className="relative rounded-2xl p-8 flex flex-col h-full"
      style={{
        background: highlighted ? '#D4AF5C' : 'rgba(255,255,255,0.06)',
        border: highlighted ? 'none' : '1px solid rgba(212,175,92,0.2)',
        boxShadow: highlighted ? '0 20px 60px rgba(212,175,92,0.2)' : 'none',
      }}
    >
      {badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
          style={{
            background: '#0F1B33',
            color: '#D4AF5C',
            fontFamily: 'var(--font-instrument),system-ui,sans-serif',
          }}
        >
          {badge}
        </div>
      )}

      <div className="mb-6">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{
            color: highlighted ? 'rgba(15,27,51,0.7)' : 'rgba(212,175,92,0.8)',
            fontFamily: 'var(--font-instrument),system-ui,sans-serif',
          }}
        >
          {name}
        </p>
        <div className="flex items-end gap-1 mb-3">
          {price.monthly === 0 ? (
            <span
              className="text-4xl font-bold"
              style={{
                fontFamily: 'var(--font-fraunces),Georgia,serif',
                color: highlighted ? '#0F1B33' : 'white',
              }}
            >
              Free
            </span>
          ) : (
            <>
              <span
                className="text-4xl font-bold"
                style={{
                  fontFamily: 'var(--font-fraunces),Georgia,serif',
                  color: highlighted ? '#0F1B33' : 'white',
                }}
              >
                ${displayPrice}
              </span>
              <span
                className="text-sm mb-1"
                style={{ color: highlighted ? 'rgba(15,27,51,0.6)' : 'rgba(255,255,255,0.5)' }}
              >
                /mo
              </span>
            </>
          )}
        </div>
        {billing === 'annual' && price.monthly > 0 && (
          <p
            className="text-xs mb-2"
            style={{ color: highlighted ? 'rgba(15,27,51,0.6)' : 'rgba(255,255,255,0.4)' }}
          >
            Billed annually (${price.annual}/yr)
          </p>
        )}
        <p
          className="text-sm leading-relaxed"
          style={{
            color: highlighted ? 'rgba(15,27,51,0.75)' : 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-instrument),system-ui,sans-serif',
          }}
        >
          {description}
        </p>
      </div>

      <ul className="flex flex-col gap-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              size={15}
              className="flex-shrink-0 mt-0.5"
              style={{ color: highlighted ? '#0F1B33' : '#D4AF5C' }}
            />
            <span
              className="text-sm leading-snug"
              style={{
                color: highlighted ? 'rgba(15,27,51,0.85)' : 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font-instrument),system-ui,sans-serif',
              }}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={cta.href}
        className="block text-center py-3 rounded-xl text-sm font-semibold transition-all duration-150"
        style={{
          background: highlighted ? '#0F1B33' : 'transparent',
          color: highlighted ? '#D4AF5C' : 'rgba(255,255,255,0.85)',
          border: highlighted ? 'none' : '1px solid rgba(212,175,92,0.4)',
          fontFamily: 'var(--font-instrument),system-ui,sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!highlighted) {
            e.currentTarget.style.borderColor = '#D4AF5C'
            e.currentTarget.style.color = '#D4AF5C'
          } else {
            e.currentTarget.style.background = '#1a2e4a'
          }
        }}
        onMouseLeave={(e) => {
          if (!highlighted) {
            e.currentTarget.style.borderColor = 'rgba(212,175,92,0.4)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.85)'
          } else {
            e.currentTarget.style.background = '#0F1B33'
          }
        }}
      >
        {cta.label}
      </Link>
    </div>
  )
}
