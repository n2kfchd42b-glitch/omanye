'use client'

import Link from 'next/link'

export default function SignupChoicePage() {
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width:          32,
            height:         32,
            borderRadius:   8,
            background:     '#0D2B1E',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontFamily:     'Palatino, Georgia, serif',
            fontWeight:     700,
            fontSize:       16,
            color:          '#D4AF5C',
          }}>
            O
          </div>
          <span style={{ fontFamily: 'Palatino, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#0D2B1E' }}>
            OMANYE
          </span>
        </div>
        <h2 style={{
          fontSize:     26,
          fontWeight:   700,
          color:        '#0F1A14',
          marginBottom: 8,
          fontFamily:   'Palatino, Georgia, serif',
        }}>
          Create your account
        </h2>
        <p style={{ fontSize: 15, color: '#4A6355' }}>
          Choose how you&apos;ll use OMANYE
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* NGO Card */}
        <Link href="/signup/ngo" style={{ textDecoration: 'none' }}>
          <div style={{
            padding:      24,
            borderRadius: 12,
            border:       '2px solid #C8EDD8',
            background:   '#FFFFFF',
            cursor:       'pointer',
            transition:   'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#2E7D52'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(26,92,58,0.1)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#C8EDD8'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
          }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width:          48,
                height:         48,
                borderRadius:   12,
                background:     '#EAF7EE',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       24,
                flexShrink:     0,
              }}>
                🏢
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>
                  I represent an NGO
                </h3>
                <p style={{ fontSize: 13, color: '#4A6355', lineHeight: 1.5 }}>
                  Manage programs, track field data, monitor budgets, and control what your donors can see.
                </p>
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    fontSize:     12,
                    fontWeight:   600,
                    color:        '#1A5C3A',
                    background:   '#E6F5EC',
                    padding:      '3px 8px',
                    borderRadius: 4,
                  }}>
                    NGO Workspace →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Donor Card */}
        <Link href="/signup/donor" style={{ textDecoration: 'none' }}>
          <div style={{
            padding:      24,
            borderRadius: 12,
            border:       '2px solid #C8EDD8',
            background:   '#FFFFFF',
            cursor:       'pointer',
            transition:   'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#D4AF5C'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(212,175,92,0.15)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = '#C8EDD8'
            ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
          }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width:          48,
                height:         48,
                borderRadius:   12,
                background:     '#FEF9EC',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       24,
                flexShrink:     0,
              }}>
                🤝
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F1A14', marginBottom: 4 }}>
                  I&apos;m a donor / funder
                </h3>
                <p style={{ fontSize: 13, color: '#4A6355', lineHeight: 1.5 }}>
                  View program progress, indicators, and impact reports for the NGOs you fund.
                </p>
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    fontSize:     12,
                    fontWeight:   600,
                    color:        '#78350F',
                    background:   '#FEF3C7',
                    padding:      '3px 8px',
                    borderRadius: 4,
                  }}>
                    Donor Portal →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#4A6355' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#1A5C3A', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
