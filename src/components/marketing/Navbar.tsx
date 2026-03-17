'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { OmanyeLogo } from '@/components/Logo'

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? '#0F1B33' : 'rgba(15,27,51,0.85)',
        backdropFilter: scrolled ? 'none' : 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(212,175,92,0.15)' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <OmanyeLogo size="sm" showTagline={false} variant="dark" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors duration-150"
              style={{
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--font-instrument),system-ui,sans-serif',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#D4AF5C')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors duration-150"
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-instrument),system-ui,sans-serif',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150"
            style={{
              background: '#D4AF5C',
              color: '#0F1B33',
              fontFamily: 'var(--font-instrument),system-ui,sans-serif',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#c49e4a')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#D4AF5C')}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-md"
          style={{ color: 'rgba(255,255,255,0.8)' }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-4 flex flex-col gap-4"
          style={{ background: '#0F1B33', borderColor: 'rgba(212,175,92,0.15)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium py-1"
              style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr style={{ borderColor: 'rgba(212,175,92,0.15)' }} />
          <Link
            href="/login"
            className="text-sm font-medium py-1"
            style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-center"
            style={{ background: '#D4AF5C', color: '#0F1B33', fontFamily: 'var(--font-instrument),system-ui,sans-serif' }}
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  )
}
