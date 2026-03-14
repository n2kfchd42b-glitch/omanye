import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: '#0D2B1E',
        canopy: '#133828',
        moss: '#1A5C3A',
        fern: '#2E7D52',
        sage: '#4CAF78',
        mint: '#7DD4A0',
        mist: '#C8EDD8',
        foam: '#EAF7EE',
        snow: '#F4FAF6',
        gold: '#D4AF5C',
      },
      fontFamily: {
        fraunces:   ['var(--font-fraunces)', 'Georgia', 'serif'],
        instrument: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
        mono:       ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      animation: {
        'slide-up':    'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        'slide-left':  'slideLeft 0.22s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':     'fadeIn 0.15s ease-out',
        'toast-in':    'toastIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'toast-out':   'toastOut 0.2s ease-in forwards',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        slideUp:   { from: { transform: 'translateY(6px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideLeft: { from: { transform: 'translateX(-6px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        toastIn:   { from: { transform: 'translateX(110%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        toastOut:  { from: { transform: 'translateX(0)', opacity: '1' }, to: { transform: 'translateX(110%)', opacity: '0' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(13,43,30,0.06), 0 1px 2px -1px rgba(13,43,30,0.04)',
        'card-md': '0 4px 12px -2px rgba(13,43,30,0.08), 0 2px 4px -2px rgba(13,43,30,0.05)',
        'modal':   '0 20px 60px -10px rgba(13,43,30,0.18), 0 8px 24px -8px rgba(13,43,30,0.12)',
        'toast':   '0 8px 24px -4px rgba(13,43,30,0.14)',
        'sidebar': '2px 0 12px 0 rgba(13,43,30,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
