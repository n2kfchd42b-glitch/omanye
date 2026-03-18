import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Blog | OMANYE',
  description: 'Insights on NGO impact measurement, donor reporting, and field data collection.',
}

export default function BlogPage() {
  return (
    <main style={{
      minHeight:   '100vh',
      background:  '#F7FAF8',
      display:     'flex',
      flexDirection: 'column',
      alignItems:  'center',
      justifyContent: 'center',
      padding:     '40px 24px',
      fontFamily:  'system-ui, sans-serif',
    }}>
      <div style={{
        maxWidth:    480,
        textAlign:   'center',
      }}>
        <div style={{
          width:          56,
          height:         56,
          borderRadius:   14,
          background:     '#0D2B1E',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'Palatino, Georgia, serif',
          fontWeight:     700,
          fontSize:       26,
          color:          '#D4AF5C',
          margin:         '0 auto 28px',
        }}>
          O
        </div>

        <h1 style={{
          fontSize:    36,
          fontWeight:  700,
          color:       '#0F1A14',
          fontFamily:  'Palatino, Georgia, serif',
          marginBottom: 12,
        }}>
          Blog coming soon
        </h1>

        <p style={{
          fontSize:    16,
          color:       '#4A6355',
          lineHeight:  1.6,
          marginBottom: 36,
        }}>
          We&apos;re working on articles about NGO impact measurement, donor
          reporting best practices, and field data collection. Check back soon.
        </p>

        <Link
          href="/"
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          8,
            padding:      '10px 22px',
            borderRadius: 8,
            background:   '#0D2B1E',
            color:        '#D4AF5C',
            fontSize:     14,
            fontWeight:   700,
            textDecoration: 'none',
          }}
        >
          ← Back to home
        </Link>
      </div>
    </main>
  )
}
