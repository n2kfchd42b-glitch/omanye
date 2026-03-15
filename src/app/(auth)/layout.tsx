import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default:  'Sign In | OMANYE',
    template: '%s | OMANYE',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      backgroundColor: '#0D2B1E',
    }}>
      {/* Left branding panel — hidden on small screens via inline media query workaround */}
      <div style={{
        width:          '420px',
        flexShrink:     0,
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        padding:        '48px 40px',
        background:     'linear-gradient(160deg, #0D2B1E 0%, #133828 60%, #1A5C3A 100%)',
        borderRight:    '1px solid rgba(212,175,92,0.15)',
      }}>
        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width:        40,
              height:       40,
              borderRadius: 10,
              background:   '#D4AF5C',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontFamily:   'Palatino, Georgia, serif',
              fontWeight:   700,
              fontSize:     20,
              color:        '#0D2B1E',
            }}>
              O
            </div>
            <span style={{
              fontFamily: 'Palatino, Georgia, serif',
              fontSize:   22,
              fontWeight: 700,
              color:      '#FFFFFF',
              letterSpacing: 1,
            }}>
              OMANYE
            </span>
          </div>

          <h1 style={{
            fontFamily:   'Palatino, Georgia, serif',
            fontSize:     32,
            fontWeight:   700,
            color:        '#FFFFFF',
            lineHeight:   1.25,
            marginBottom: 16,
          }}>
            NGO Workspace &amp;<br />Donor Transparency
          </h1>

          <p style={{
            fontSize:   15,
            color:      'rgba(255,255,255,0.6)',
            lineHeight: 1.65,
            marginBottom: 40,
          }}>
            One platform for NGOs to manage programs, field data, and budgets —
            and for donors to track real impact with the access they&apos;ve been granted.
          </p>

          {/* Feature bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📊', text: 'Real-time program indicators & logframes' },
              { icon: '🔒', text: 'Granular donor access control — you decide what they see' },
              { icon: '🌍', text: 'Field data collection & team coordination' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 18, lineHeight: 1.4 }}>{icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} OMANYE · Built for NGOs
        </p>
      </div>

      {/* Right content panel */}
      <div style={{
        flex:            1,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '48px 24px',
        backgroundColor: '#F4FAF6',
        overflowY:       'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
