import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        fraunces:   ['var(--font-fraunces)', 'Georgia', 'serif'],
        instrument: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
        mono:       ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-up':    'fadeUp 0.3s ease forwards',
        'fade-up-d1': 'fadeUp 0.3s 0.05s ease both',
        'fade-up-d2': 'fadeUp 0.3s 0.10s ease both',
        'fade-up-d3': 'fadeUp 0.3s 0.15s ease both',
        'fade-up-d4': 'fadeUp 0.3s 0.20s ease both',
        'shimmer':    'shimmer 1.4s infinite',
        'spin-slow':  'spin 1s linear infinite',
        'toast-in':   'toastIn 0.28s cubic-bezier(0.16,1,0.3,1)',
        'toast-out':  'toastOut 0.2s ease-in forwards',
        'pill':       'pillExpand 0.25s ease',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        toastIn:  { from: { transform: 'translateX(110%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        toastOut: { from: { transform: 'translateX(0)',    opacity: '1' }, to: { transform: 'translateX(110%)', opacity: '0' } },
        pillExpand: { from: { width: '8px' }, to: { width: '28px' } },
      },
    },
  },
  plugins: [],
}

export default config
