import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/views/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1B33',
          card:    '#1A2B4A',
          border:  '#2D3F5C',
          muted:   '#3D4F6C',
          sidebar: '#0A1628',
          hover:   '#243352',
        },
        gold: {
          DEFAULT: '#D4AF5C',
          light:   '#E8D48B',
          dark:    '#B8942E',
        },
        // Keep backward-compat aliases used in existing Tailwind classes
        forest:   '#0F1B33',
        canopy:   '#0A1628',
        moss:     '#D4AF5C',
        fern:     '#60A5FA',
        sage:     '#D4AF5C',
        mint:     '#E8D48B',
        mist:     '#2D3F5C',
        foam:     '#243352',
        snow:     '#0F1B33',
        amber:    '#D4AF5C',
        crimson:  '#E53E3E',
        sky:      '#60A5FA',
        pearl:    '#1A2B4A',
        stone:    '#6B7A99',
        slate:    '#A0AEC0',
        charcoal: '#FFFFFF',
        ink:      '#0F1B33',
      },
      fontFamily: {
        serif:      ['Palatino Linotype', 'Book Antiqua', 'Palatino', 'Georgia', 'serif'],
        sans:       ['DM Sans', 'system-ui', 'sans-serif'],
        mono:       ['JetBrains Mono', 'Consolas', 'monospace'],
        fraunces:   ['var(--font-fraunces)', 'Georgia', 'serif'],
        instrument: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        gold: '0 0 20px rgba(212, 175, 92, 0.15)',
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
